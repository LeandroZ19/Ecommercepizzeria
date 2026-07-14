-- ============================================================================
-- RapiPizza — Función atómica para crear pedido + items (SECURITY DEFINER)
-- Ejecutar en: https://supabase.com/dashboard/project/wdiflamxurlzstyicdma/sql/new
--
-- Esta función reemplaza los INSERT directos desde el cliente.
-- SECURITY DEFINER bypasa RLS completamente — sin problemas de políticas.
-- Crea order + order_items en una sola transacción atómica.
-- ============================================================================

-- ── 1. Asegurar que las columnas necesarias existen ───────────────────────────

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS subtotal     NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS variant_name TEXT,
  ADD COLUMN IF NOT EXISTS created_at   TIMESTAMPTZ   NOT NULL DEFAULT now();

ALTER TABLE public.order_items
  ALTER COLUMN product_id DROP NOT NULL;

-- ── 2. Función principal: crea orden + items en una transacción ───────────────

CREATE OR REPLACE FUNCTION public.create_order_with_items(
  p_user_id        UUID,
  p_items          JSONB,
  p_total          NUMERIC,
  p_subtotal       NUMERIC,
  p_discount       NUMERIC,
  p_delivery_fee   NUMERIC,
  p_district       TEXT,
  p_delivery_type  TEXT,
  p_payment_method TEXT,
  p_address        TEXT,
  p_coupon_code    TEXT,
  p_customer_name  TEXT,
  p_customer_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order     orders%ROWTYPE;
  v_item      JSONB;
  v_order_num INTEGER;
BEGIN
  -- Generar número de orden secuencial
  SELECT COALESCE(MAX(order_number), 1000) + 1 INTO v_order_num FROM orders;

  -- Insertar la orden
  INSERT INTO orders (
    user_id, order_number, status, total, subtotal, discount,
    delivery_fee, district, delivery_type, payment_method,
    address, coupon_code, customer_name, customer_phone
  ) VALUES (
    p_user_id, v_order_num, 'pending', p_total, p_subtotal, p_discount,
    p_delivery_fee, NULLIF(p_district, ''), p_delivery_type, p_payment_method,
    NULLIF(p_address, ''), NULLIF(p_coupon_code, ''), NULLIF(p_customer_name, ''), NULLIF(p_customer_phone, '')
  )
  RETURNING * INTO v_order;

  -- Insertar cada item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id, product_id, product_name, product_image,
      price, quantity, subtotal, variant_name
    ) VALUES (
      v_order.id,
      COALESCE(v_item->>'product_id', v_item->>'product_name'),
      v_item->>'product_name',
      NULLIF(v_item->>'product_image', ''),
      (v_item->>'price')::NUMERIC,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'price')::NUMERIC * (v_item->>'quantity')::INTEGER,
      v_item->>'variant_name'
    );
  END LOOP;

  -- Retornar la orden creada como JSON
  RETURN row_to_json(v_order)::JSONB;

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'create_order_with_items failed: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_with_items(
  UUID, JSONB, NUMERIC, NUMERIC, NUMERIC, NUMERIC,
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO authenticated, anon;

-- ── 3. Política SELECT para que admin vea order_items ─────────────────────────

DROP POLICY IF EXISTS "admin_delivery_view_all_items" ON public.order_items;
CREATE POLICY "admin_delivery_view_all_items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'delivery')
    )
  );

-- Clientes ven sus propios items
DROP POLICY IF EXISTS "customer_view_own_items" ON public.order_items;
CREATE POLICY "customer_view_own_items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- ── 4. Verificar que funciona ─────────────────────────────────────────────────

-- Prueba rápida (puedes ejecutar solo esta parte si quieres verificar):
SELECT proname, prosecdef
FROM pg_proc
WHERE proname = 'create_order_with_items';
-- Debe aparecer una fila con prosecdef = true
