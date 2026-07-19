-- ============================================================================
-- RapiPizza — FIX CRÍTICO: trigger usa v_product_id UUID pero products.id es TEXT
-- El trigger fallaba con "invalid input syntax for type uuid: rapilover-1"
-- porque intentaba cargar un TEXT slug en una variable UUID.
-- Ejecutar en: https://supabase.com/dashboard/project/wdiflamxurlzstyicdma/sql/new
-- ============================================================================

-- Recrear el trigger con v_product_id TEXT (no UUID)
CREATE OR REPLACE FUNCTION public.handle_order_item_stock_decrement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_product_id TEXT;   -- TEXT, no UUID, porque products.id puede ser slug
  v_base_name  TEXT;
BEGIN
  -- Limpiar sufijo de tamaño: "Pizza (Mediana)" → "Pizza"
  v_base_name := trim(regexp_replace(NEW.product_name, '\s*\(.*\)\s*$', '', 'i'));

  -- Buscar producto por nombre exacto primero
  SELECT id::TEXT INTO v_product_id
  FROM products WHERE name ILIKE v_base_name LIMIT 1;

  -- Si no, buscar por nombre parcial
  IF v_product_id IS NULL THEN
    SELECT id::TEXT INTO v_product_id
    FROM products WHERE name ILIKE '%' || v_base_name || '%'
    ORDER BY length(name) LIMIT 1;
  END IF;

  -- Decrementar stock si se encontró el producto
  IF v_product_id IS NOT NULL THEN
    UPDATE products
    SET stock = GREATEST(0, stock - NEW.quantity)
    WHERE id::TEXT = v_product_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Recrear el trigger
DROP TRIGGER IF EXISTS trg_order_item_stock ON public.order_items;
CREATE TRIGGER trg_order_item_stock
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_item_stock_decrement();

-- También corregir la función de decrement_product_stock que tiene el mismo problema
CREATE OR REPLACE FUNCTION public.decrement_product_stock(
  p_product_name TEXT,
  p_amount       INTEGER DEFAULT 1
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id   TEXT;   -- TEXT, no UUID
  v_base TEXT;
BEGIN
  v_base := trim(regexp_replace(p_product_name, '\s*\(.*\)\s*$', '', 'i'));

  SELECT id::TEXT INTO v_id FROM products WHERE name ILIKE v_base LIMIT 1;
  IF v_id IS NULL THEN
    SELECT id::TEXT INTO v_id FROM products
    WHERE name ILIKE '%' || v_base || '%'
    ORDER BY length(name) LIMIT 1;
  END IF;

  IF v_id IS NOT NULL THEN
    UPDATE products SET stock = GREATEST(0, stock - p_amount)
    WHERE id::TEXT = v_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_product_stock(TEXT, INTEGER) TO authenticated, anon;
