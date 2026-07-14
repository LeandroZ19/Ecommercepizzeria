-- ============================================================================
-- RapiPizza — FIX DEFINITIVO: guardar productos en order_items
-- Ejecutar en: https://supabase.com/dashboard/project/wdiflamxurlzstyicdma/sql/new
-- ============================================================================

-- Paso 1: columnas que necesita el código
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS subtotal     NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_name TEXT;
ALTER TABLE public.order_items ALTER COLUMN product_id DROP NOT NULL;

-- Paso 2: recrear insert_order_items (SECURITY DEFINER bypasa RLS — igual que custom_pizzas)
CREATE OR REPLACE FUNCTION public.insert_order_items(p_items JSONB)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE item JSONB;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.order_items (
      order_id, product_id, product_name, product_image, price, quantity, subtotal, variant_name
    ) VALUES (
      (item->>'order_id')::uuid,
      COALESCE(NULLIF(item->>'product_id',''), item->>'product_name'),
      item->>'product_name',
      NULLIF(item->>'product_image',''),
      (item->>'price')::numeric,
      (item->>'quantity')::integer,
      COALESCE((item->>'subtotal')::numeric, (item->>'price')::numeric * (item->>'quantity')::integer),
      NULLIF(item->>'variant_name','')
    );
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_order_items(JSONB) TO authenticated, anon;

-- Paso 3: política SELECT para admin y delivery
DROP POLICY IF EXISTS "admin_delivery_view_all_items" ON public.order_items;
CREATE POLICY "admin_delivery_view_all_items"
  ON public.order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','delivery')
  ));

-- Paso 4: política SELECT para clientes
DROP POLICY IF EXISTS "customer_view_own_items" ON public.order_items;
CREATE POLICY "customer_view_own_items"
  ON public.order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  ));

-- Paso 5: política INSERT para clientes (fallback si RPC falla)
DROP POLICY IF EXISTS "customer_insert_own_items" ON public.order_items;
CREATE POLICY "customer_insert_own_items"
  ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  ));

-- Verificación: debe mostrar insert_order_items con prosecdef=true
SELECT proname, prosecdef FROM pg_proc WHERE proname = 'insert_order_items';
