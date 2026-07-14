-- ============================================================================
-- RapiPizza — SQL MÍNIMO URGENTE
-- Ejecutar en: https://supabase.com/dashboard/project/wdiflamxurlzstyicdma/sql/new
--
-- Solo hace 4 cosas esenciales:
--   1. Permite a admin/delivery VER todos los order_items (sin esto el panel admin
--      muestra pedidos vacíos aunque los items sí estén en la BD)
--   2. Permite a clientes INSERTAR order_items de sus propios pedidos
--   3. Crea el trigger que descuenta stock automáticamente al insertar un order_item
--   4. Añade columnas subtotal/variant_name si no existen (idempotente)
-- ============================================================================

-- ── 1. Admin + Delivery: VER todos los order_items ───────────────────────────
-- (sin esta política el panel admin ve pedidos con 0 productos)

DROP POLICY IF EXISTS "admin_view_all_items"          ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "admin_delivery_view_all_items"  ON public.order_items;
DROP POLICY IF EXISTS "admin_delivery_select_all_items" ON public.order_items;

CREATE POLICY "admin_delivery_view_all_items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'delivery')
    )
  );

-- ── 2. Clientes: INSERTAR items en sus propios pedidos ────────────────────────

DROP POLICY IF EXISTS "customer_insert_own_items"              ON public.order_items;
DROP POLICY IF EXISTS "Users can create their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Items creados si el pedido es del usuario" ON public.order_items;

CREATE POLICY "customer_insert_own_items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id   = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- ── 3. Trigger de stock automático ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_order_item_stock_decrement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_product_id uuid;
  v_base_name  text;
BEGIN
  v_base_name := trim(regexp_replace(NEW.product_name, '\s*\(.*\)\s*$', '', 'i'));

  SELECT id INTO v_product_id FROM products WHERE name ILIKE v_base_name LIMIT 1;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM products
    WHERE name ILIKE '%' || v_base_name || '%'
    ORDER BY length(name) LIMIT 1;
  END IF;

  IF v_product_id IS NOT NULL THEN
    UPDATE products SET stock = GREATEST(0, stock - NEW.quantity) WHERE id = v_product_id;
  ELSE
    RAISE WARNING 'stock_decrement: producto no encontrado para "%"', NEW.product_name;
  END IF;

  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_order_item_stock_decrement() TO authenticated, anon;

DROP TRIGGER IF EXISTS trg_order_item_stock ON public.order_items;
CREATE TRIGGER trg_order_item_stock
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_item_stock_decrement();

-- ── 4. Añadir columnas faltantes (idempotente, no rompe nada) ─────────────────

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS subtotal     NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS variant_name TEXT;

-- Permitir product_id vacío (el código usa el nombre como fallback)
ALTER TABLE public.order_items
  ALTER COLUMN product_id DROP NOT NULL;

-- ── 5. Función RPC para decrementar stock desde el cliente ───────────────────
-- (usado como fallback en Checkout.tsx por si el trigger no se dispara)

CREATE OR REPLACE FUNCTION public.decrement_product_stock(
  p_product_name TEXT,
  p_amount       INTEGER DEFAULT 1
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id   uuid;
  v_base text;
BEGIN
  v_base := trim(regexp_replace(p_product_name, '\s*\(.*\)\s*$', '', 'i'));

  SELECT id INTO v_id FROM products WHERE name ILIKE v_base LIMIT 1;
  IF v_id IS NULL THEN
    SELECT id INTO v_id FROM products
    WHERE name ILIKE '%' || v_base || '%'
    ORDER BY length(name) LIMIT 1;
  END IF;

  IF v_id IS NOT NULL THEN
    UPDATE products SET stock = GREATEST(0, stock - p_amount) WHERE id = v_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_product_stock(TEXT, INTEGER) TO authenticated, anon;

-- ── 6. Función RPC para insertar order_items (SECURITY DEFINER — bypasa RLS) ─
-- Necesaria por si las políticas RLS de INSERT fueron eliminadas por migraciones anteriores.
-- El código en db.ts usa esta función como último recurso si el INSERT directo falla.

CREATE OR REPLACE FUNCTION public.insert_order_items(
  p_items JSONB
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  item JSONB;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id, product_id, product_name, product_image, price, quantity, subtotal, variant_name
    ) VALUES (
      (item->>'order_id')::uuid,
      item->>'product_id',
      item->>'product_name',
      item->>'product_image',
      (item->>'price')::numeric,
      (item->>'quantity')::integer,
      (item->>'subtotal')::numeric,
      item->>'variant_name'
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_order_items(JSONB) TO authenticated, anon;

-- ── Verificación: ejecuta esto y verifica que ves los items de tus pedidos ───

SELECT
  o.order_number,
  o.customer_name,
  o.status,
  COUNT(oi.id) AS total_items,
  SUM(oi.quantity) AS total_productos
FROM public.orders o
LEFT JOIN public.order_items oi ON oi.order_id = o.id
GROUP BY o.id, o.order_number, o.customer_name, o.status
ORDER BY o.created_at DESC
LIMIT 10;
