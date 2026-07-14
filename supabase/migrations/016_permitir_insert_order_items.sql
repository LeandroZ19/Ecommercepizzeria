-- ============================================================================
-- RapiPizza — Permitir INSERT en order_items desde el cliente
-- Ejecutar en: https://supabase.com/dashboard/project/wdiflamxurlzstyicdma/sql/new
-- ============================================================================

-- Eliminar políticas conflictivas anteriores
DROP POLICY IF EXISTS "customer_insert_own_items"              ON public.order_items;
DROP POLICY IF EXISTS "Users can create their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Items creados si el pedido es del usuario" ON public.order_items;

-- Crear política INSERT limpia
CREATE POLICY "customer_insert_own_items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Asegurar columnas que el código usa (seguro si ya existen)
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS subtotal     NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS variant_name TEXT;

ALTER TABLE public.order_items
  ALTER COLUMN product_id DROP NOT NULL;

-- Recrear insert_order_items SECURITY DEFINER (bypasa RLS completamente)
CREATE OR REPLACE FUNCTION public.insert_order_items(p_items JSONB)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE item JSONB;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.order_items (
      order_id, product_id, product_name, product_image, price, quantity, subtotal, variant_name
    ) VALUES (
      (item->>'order_id')::uuid,
      COALESCE(NULLIF(item->>'product_id', ''), item->>'product_name'),
      item->>'product_name',
      NULLIF(item->>'product_image', ''),
      (item->>'price')::numeric,
      (item->>'quantity')::integer,
      COALESCE((item->>'subtotal')::numeric, (item->>'price')::numeric * (item->>'quantity')::integer),
      NULLIF(item->>'variant_name', '')
    );
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_order_items(JSONB) TO authenticated, anon;

-- Verificar: debe mostrar la función con prosecdef = true
SELECT proname, prosecdef FROM pg_proc WHERE proname = 'insert_order_items';
