-- ============================================================================
-- RapiPizza — Roles, Stock y Número de Orden
-- File: 005_roles_stock_ordernumber.sql
--
-- Ejecutar en: https://supabase.com/dashboard/project/wdiflamxurlzstyicdma/sql/new
-- Ejecutar DESPUÉS de 002, 003 y 004.
--
-- Cambios:
--   profiles   — columna `role` (customer | admin | delivery)
--   orders     — columna `order_number` con secuencia autoincremental desde 1001
--   products   — columna `stock` (inventario)
--   RLS        — políticas adicionales para admin y delivery
-- ============================================================================

-- ── 1. Rol en perfiles ────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer'
  CHECK (role IN ('customer', 'admin', 'delivery'));

COMMENT ON COLUMN public.profiles.role IS
  'Rol del usuario: customer=cliente, admin=administrador, delivery=repartidor';

-- ── 2. Número de orden secuencial (Cola Virtual) ──────────────────────────────

CREATE SEQUENCE IF NOT EXISTS public.order_number_seq
  START WITH 1001
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number INTEGER DEFAULT nextval('public.order_number_seq');

COMMENT ON COLUMN public.orders.order_number IS
  'Número de orden secuencial visible al cliente (Cola Virtual), inicia en 1001';

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- ── 3. Stock de productos ─────────────────────────────────────────────────────

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 100;

COMMENT ON COLUMN public.products.stock IS
  'Unidades disponibles en inventario';

-- ── 4. RLS: Admin y Delivery pueden ver todos los pedidos ─────────────────────

DROP POLICY IF EXISTS "Admins and delivery can view all orders" ON public.orders;
CREATE POLICY "Admins and delivery can view all orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'delivery')
    )
  );

-- ── 5. RLS: Admin y Delivery pueden actualizar pedidos ───────────────────────

DROP POLICY IF EXISTS "Admins and delivery can update orders" ON public.orders;
CREATE POLICY "Admins and delivery can update orders"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'delivery')
    )
  );

-- ── 6. RLS: Admin puede actualizar productos (stock) ─────────────────────────

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── 7. RLS: Admin y Delivery pueden ver items de todos los pedidos ────────────

DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
CREATE POLICY "Admins can view all order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'delivery')
    )
  );

-- ── 8. Asignar rol admin (ejecutar manualmente con tu UUID) ───────────────────
-- UPDATE public.profiles SET role = 'admin'   WHERE id = '<UUID>';
-- UPDATE public.profiles SET role = 'delivery' WHERE id = '<UUID>';
