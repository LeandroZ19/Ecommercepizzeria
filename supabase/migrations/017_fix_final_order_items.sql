-- ============================================================================
-- RapiPizza — FIX FINAL: product_id es UUID, los IDs del carrito son TEXT
-- Ejecutar en: https://supabase.com/dashboard/project/wdiflamxurlzstyicdma/sql/new
-- ============================================================================

-- 1. Cambiar product_id de UUID a TEXT (el error "rapilover-1" es por esto)
ALTER TABLE public.order_items
  ALTER COLUMN product_id TYPE TEXT USING product_id::TEXT;

-- 2. Permitir product_id vacío
ALTER TABLE public.order_items
  ALTER COLUMN product_id DROP NOT NULL;

-- 3. Añadir columnas si no existen
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='order_items' AND column_name='subtotal')
  THEN
    ALTER TABLE public.order_items ADD COLUMN subtotal NUMERIC(10,2) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='order_items' AND column_name='variant_name')
  THEN
    ALTER TABLE public.order_items ADD COLUMN variant_name TEXT;
  END IF;
END $$;

-- 4. Recrear insert_order_items sin product_id (evita el error UUID)
CREATE OR REPLACE FUNCTION public.insert_order_items(p_items JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
BEGIN
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.order_items (
      order_id,
      product_name,
      product_image,
      price,
      quantity,
      subtotal,
      variant_name
    ) VALUES (
      (v_item->>'order_id')::uuid,
      v_item->>'product_name',
      NULLIF(v_item->>'product_image', ''),
      (v_item->>'price')::numeric,
      (v_item->>'quantity')::integer,
      COALESCE(
        NULLIF(v_item->>'subtotal', '')::numeric,
        (v_item->>'price')::numeric * (v_item->>'quantity')::integer
      ),
      NULLIF(v_item->>'variant_name', '')
    );
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_order_items(JSONB) TO authenticated, anon;

-- 5. Política SELECT: admin y delivery ven todos los items
DROP POLICY IF EXISTS "admin_delivery_view_all_items" ON public.order_items;
CREATE POLICY "admin_delivery_view_all_items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'delivery')
    )
  );

-- 6. Política SELECT: clientes ven sus propios items
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

-- 7. Política INSERT: clientes pueden insertar sus propios items
DROP POLICY IF EXISTS "customer_insert_own_items" ON public.order_items;
CREATE POLICY "customer_insert_own_items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- VERIFICACIÓN FINAL:
SELECT proname, prosecdef FROM pg_proc WHERE proname = 'insert_order_items';
-- Debe mostrar: insert_order_items | t

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'order_items'
ORDER BY ordinal_position;
-- product_id debe ser "text" ahora, no "uuid"
