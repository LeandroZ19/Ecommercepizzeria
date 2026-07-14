-- ============================================================================
-- RapiPizza — Fix definitivo de order_items + RLS completo
-- File: 010_fix_order_items_schema.sql
--
-- Ejecutar en: https://supabase.com/dashboard/project/wdiflamxurlzstyicdma/sql/new
--
-- PROBLEMA RAÍZ identificado:
--   La migración 001 creó order_items SIN columnas subtotal, variant_name, created_at.
--   La migración 002 usó CREATE TABLE IF NOT EXISTS → ignorada, tabla ya existía.
--   El código en db.ts intentaba insertar esas columnas → INSERT fallaba silenciosamente.
--   product_id era TEXT NOT NULL → al pasar null (fix incorrecto anterior) también fallaba.
--
-- Este script:
--   1. Agrega columnas faltantes a order_items
--   2. Recrea todas las políticas RLS necesarias (admin, delivery, customer)
--   3. Recrea trigger de stock
--   4. Recrea función de cola virtual
-- ============================================================================

-- ── 1. Agregar columnas faltantes a order_items ───────────────────────────────

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS subtotal      NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS variant_name  TEXT,
  ADD COLUMN IF NOT EXISTS created_at    TIMESTAMPTZ NOT NULL DEFAULT now();

-- Asegurarse que product_id acepta valores de texto libre (no UUID)
-- Ya es TEXT, solo verificamos que acepta NULL también por flexibilidad
ALTER TABLE public.order_items
  ALTER COLUMN product_id DROP NOT NULL;

COMMENT ON COLUMN public.order_items.subtotal     IS 'price * quantity';
COMMENT ON COLUMN public.order_items.variant_name IS 'Nombre del tamaño si se seleccionó variante (ej: Mediana)';

-- ── 2. RLS: clientes pueden ver SUS order_items ───────────────────────────────

DROP POLICY IF EXISTS "Items visibles si el pedido es del usuario"   ON public.order_items;
DROP POLICY IF EXISTS "Items creados si el pedido es del usuario"    ON public.order_items;
DROP POLICY IF EXISTS "Users can view their own order items"         ON public.order_items;
DROP POLICY IF EXISTS "Users can create their own order items"       ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items"              ON public.order_items;

CREATE POLICY "customer_select_own_items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "customer_insert_own_items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- ── 3. RLS: admin y delivery pueden ver TODOS los order_items ─────────────────

CREATE POLICY "admin_delivery_select_all_items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'delivery')
    )
  );

-- ── 4. RLS: orders — admin y delivery ven y actualizan todos los pedidos ──────

DROP POLICY IF EXISTS "Admins and delivery can view all orders"   ON public.orders;
DROP POLICY IF EXISTS "Admins and delivery can update orders"     ON public.orders;
DROP POLICY IF EXISTS "admin_delivery_select_orders"             ON public.orders;
DROP POLICY IF EXISTS "admin_delivery_update_orders"             ON public.orders;

CREATE POLICY "admin_delivery_select_orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'delivery')
    )
  );

CREATE POLICY "admin_delivery_update_orders"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'delivery')
    )
  );

-- ── 5. Trigger de stock (idempotente) ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_order_item_stock_decrement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_product_id uuid;
  v_base_name  text;
BEGIN
  -- Quitar sufijo de tamaño "(Mediana)", "(Grande)" etc.
  v_base_name := trim(regexp_replace(NEW.product_name, '\s*\(.*\)\s*$', '', 'i'));

  SELECT id INTO v_product_id FROM products
  WHERE name ILIKE v_base_name LIMIT 1;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM products
    WHERE name ILIKE '%' || v_base_name || '%'
    ORDER BY length(name) LIMIT 1;
  END IF;

  IF v_product_id IS NOT NULL THEN
    UPDATE products SET stock = GREATEST(0, stock - NEW.quantity) WHERE id = v_product_id;
  ELSE
    RAISE WARNING 'stock_decrement: product not found for "%"', NEW.product_name;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_item_stock ON public.order_items;
CREATE TRIGGER trg_order_item_stock
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_item_stock_decrement();

GRANT EXECUTE ON FUNCTION public.handle_order_item_stock_decrement() TO authenticated, anon;

-- ── 6. Función cola virtual (idempotente) ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_queue_position(p_order_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_num integer; v_ts timestamptz; v_pos integer;
BEGIN
  SELECT order_number, created_at INTO v_num, v_ts FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF v_num IS NOT NULL THEN
    SELECT COUNT(*)+1 INTO v_pos FROM orders
    WHERE status IN ('pending','preparing') AND order_number < v_num;
  ELSE
    SELECT COUNT(*)+1 INTO v_pos FROM orders
    WHERE status IN ('pending','preparing') AND created_at < v_ts;
  END IF;
  RETURN v_pos;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_queue_position(uuid) TO authenticated, anon;

-- ── 7. Verificación ───────────────────────────────────────────────────────────

-- Muestra la estructura actual de order_items:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'order_items'
ORDER BY ordinal_position;
