-- ============================================================================
-- RapiPizza — Fix completo: order_items admin access + stock trigger
-- File: 009_fix_order_items_admin_access.sql
--
-- Ejecutar en: https://supabase.com/dashboard/project/wdiflamxurlzstyicdma/sql/new
--
-- ¿Qué corrige este script?
--   1. Asegura que Admin y Delivery puedan ver order_items de TODOS los pedidos
--   2. Re-crea el trigger de stock (idempotente, por si 007 no se ejecutó)
--   3. Asegura que Admin puede leer todos los pedidos
--   4. Provee consulta diagnóstico para verificar el estado de la BD
-- ============================================================================

-- ── 1. Admin y Delivery pueden SELECT en order_items (todos los pedidos) ─────

DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
CREATE POLICY "Admins can view all order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'delivery')
    )
  );

-- ── 2. Admin y Delivery pueden SELECT en orders (todos los pedidos) ──────────

DROP POLICY IF EXISTS "Admins and delivery can view all orders" ON public.orders;
CREATE POLICY "Admins and delivery can view all orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'delivery')
    )
  );

-- ── 3. Admin y Delivery pueden UPDATE en orders (cambiar estado) ─────────────

DROP POLICY IF EXISTS "Admins and delivery can update orders" ON public.orders;
CREATE POLICY "Admins and delivery can update orders"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'delivery')
    )
  );

-- ── 4. Asegurarse que product_id en order_items acepta NULL ──────────────────
-- (ya debería ser NULL por el schema, esto es por si acaso)
ALTER TABLE public.order_items
  ALTER COLUMN product_id DROP NOT NULL;

-- ── 5. Re-crear trigger de stock (idempotente) ────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_order_item_stock_decrement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id uuid;
  v_base_name  text;
BEGIN
  v_base_name := regexp_replace(NEW.product_name, '\s*\(.*\)\s*$', '', 'i');
  v_base_name := trim(v_base_name);

  SELECT id INTO v_product_id
    FROM products
   WHERE name ILIKE v_base_name
   LIMIT 1;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id
      FROM products
     WHERE name ILIKE '%' || v_base_name || '%'
     ORDER BY length(name)
     LIMIT 1;
  END IF;

  IF v_product_id IS NULL THEN
    RAISE WARNING 'stock_decrement: product not found for "%"', NEW.product_name;
    RETURN NEW;
  END IF;

  UPDATE products
     SET stock = GREATEST(0, stock - NEW.quantity)
   WHERE id = v_product_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_item_stock ON public.order_items;
CREATE TRIGGER trg_order_item_stock
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_item_stock_decrement();

-- ── 6. Re-crear función get_queue_position (por si 006 no se ejecutó) ─────────

CREATE OR REPLACE FUNCTION public.get_queue_position(p_order_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_number integer;
  v_created_at   timestamptz;
  v_position     integer;
BEGIN
  SELECT order_number, created_at
    INTO v_order_number, v_created_at
    FROM orders
   WHERE id = p_order_id;

  IF NOT FOUND THEN RETURN NULL; END IF;

  IF v_order_number IS NOT NULL THEN
    SELECT COUNT(*) + 1 INTO v_position
      FROM orders
     WHERE status IN ('pending', 'preparing')
       AND order_number < v_order_number;
  ELSE
    SELECT COUNT(*) + 1 INTO v_position
      FROM orders
     WHERE status IN ('pending', 'preparing')
       AND created_at < v_created_at;
  END IF;

  RETURN v_position;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_queue_position(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_order_item_stock_decrement() TO anon, authenticated;

-- ── 7. Diagnóstico — ver estado actual ────────────────────────────────────────

-- Pedidos con y sin items
SELECT
  o.id,
  o.order_number,
  o.customer_name,
  o.total,
  o.status,
  o.created_at,
  COUNT(oi.id) AS item_count
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id
ORDER BY o.created_at DESC
LIMIT 10;
