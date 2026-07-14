-- ============================================================================
-- RapiPizza — FIX DEFINITIVO (ejecutar en Supabase SQL Editor)
-- https://supabase.com/dashboard/project/wdiflamxurlzstyicdma/sql/new
--
-- PROBLEMA RAÍZ CONFIRMADO:
--   La tabla order_items fue creada por migration 001 SIN las columnas:
--     - subtotal      (NUMERIC)
--     - variant_name  (TEXT)
--     - created_at    (TIMESTAMPTZ)
--   El código en db.ts intenta INSERT esas columnas → ERROR de Postgres →
--   el INSERT de order_items FALLA → los pedidos no tienen productos →
--   el stock nunca se decrementa.
--
-- Este script hace UN SOLO PASO: añade las columnas faltantes + arregla RLS +
-- crea el trigger de stock + recrea get_queue_position.
-- Es idempotente (se puede correr múltiples veces sin error).
-- ============================================================================

-- ── PASO 1: Añadir columnas faltantes a order_items ──────────────────────────

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS subtotal      NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS variant_name  TEXT,
  ADD COLUMN IF NOT EXISTS created_at    TIMESTAMPTZ NOT NULL DEFAULT now();

-- Permite product_id vacío (el código usa el nombre como fallback)
ALTER TABLE public.order_items
  ALTER COLUMN product_id DROP NOT NULL;

-- ── PASO 2: Limpiar todas las políticas RLS anteriores ───────────────────────

-- order_items
DROP POLICY IF EXISTS "Items visibles si el pedido es del usuario"    ON public.order_items;
DROP POLICY IF EXISTS "Items creados si el pedido es del usuario"     ON public.order_items;
DROP POLICY IF EXISTS "Users can view their own order items"          ON public.order_items;
DROP POLICY IF EXISTS "Users can create their own order items"        ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items"               ON public.order_items;
DROP POLICY IF EXISTS "admin_delivery_select_all_items"               ON public.order_items;
DROP POLICY IF EXISTS "customer_select_own_items"                     ON public.order_items;
DROP POLICY IF EXISTS "customer_insert_own_items"                     ON public.order_items;

-- orders
DROP POLICY IF EXISTS "Admins and delivery can view all orders"       ON public.orders;
DROP POLICY IF EXISTS "Admins and delivery can update orders"         ON public.orders;
DROP POLICY IF EXISTS "admin_delivery_select_orders"                  ON public.orders;
DROP POLICY IF EXISTS "admin_delivery_update_orders"                  ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders"               ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders"             ON public.orders;

-- ── PASO 3: Recrear políticas RLS limpias ────────────────────────────────────

-- Clientes: ver sus propios pedidos
CREATE POLICY "customer_view_own_orders"
  ON public.orders FOR SELECT
  USING (user_id = auth.uid());

-- Clientes: crear sus propios pedidos
CREATE POLICY "customer_insert_own_orders"
  ON public.orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admin + Delivery: ver TODOS los pedidos
CREATE POLICY "admin_delivery_view_all_orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','delivery'))
  );

-- Admin + Delivery: actualizar estado del pedido
CREATE POLICY "admin_delivery_update_all_orders"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','delivery'))
  );

-- Admin + Delivery: eliminar pedidos huérfanos (necesario para rollback en db.ts)
CREATE POLICY "admin_delete_orders"
  ON public.orders FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Clientes: ver items de sus propios pedidos
CREATE POLICY "customer_view_own_items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

-- Clientes: insertar items en sus propios pedidos
CREATE POLICY "customer_insert_own_items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

-- Admin + Delivery: ver TODOS los items
CREATE POLICY "admin_delivery_view_all_items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','delivery'))
  );

-- ── PASO 4: Trigger de stock automático ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_order_item_stock_decrement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_product_id uuid;
  v_base_name  text;
BEGIN
  -- Eliminar sufijo de tamaño: "(Mediana)", "(Grande)" etc.
  v_base_name := trim(regexp_replace(NEW.product_name, '\s*\(.*\)\s*$', '', 'i'));

  -- Búsqueda exacta primero
  SELECT id INTO v_product_id FROM products WHERE name ILIKE v_base_name LIMIT 1;

  -- Si no, búsqueda parcial
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

-- ── PASO 5: Función cola virtual ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_queue_position(p_order_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_num integer;
  v_ts  timestamptz;
  v_pos integer;
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

-- ── PASO 6: Verificación ─────────────────────────────────────────────────────

-- Deberías ver las columnas: id, order_id, product_id, product_name, product_image,
-- price, quantity, subtotal, variant_name, created_at
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'order_items'
ORDER BY ordinal_position;
