-- ============================================================================
-- RapiPizza — Trigger para reducir stock automáticamente al crear un pedido
-- File: 007_stock_trigger.sql
--
-- Ejecutar en: https://supabase.com/dashboard/project/wdiflamxurlzstyicdma/sql/new
-- Ejecutar DESPUÉS de 006.
--
-- Por qué un trigger en lugar del frontend:
--   - Los clientes no pueden hacer UPDATE en products (RLS)
--   - Llamar supabase.rpc() desde el frontend puede fallar si la sesión caduca
--   - El trigger se ejecuta en la base de datos con privilegios del owner
--   - Garantía: si se inserta un order_item, el stock SE RESTA. Siempre.
-- ============================================================================

-- ── Función trigger ───────────────────────────────────────────────────────────

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
  -- Limpiar sufijo de tamaño: "(Mediana)", "(Grande)", etc.
  v_base_name := regexp_replace(NEW.product_name, '\s*\(.*\)\s*$', '', 'i');
  v_base_name := trim(v_base_name);

  -- 1. Coincidir exacto (case-insensitive)
  SELECT id INTO v_product_id
    FROM products
   WHERE name ILIKE v_base_name
   LIMIT 1;

  -- 2. Coincidir parcial (%nombre%)
  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id
      FROM products
     WHERE name ILIKE '%' || v_base_name || '%'
     ORDER BY length(name)
     LIMIT 1;
  END IF;

  -- 3. Coincidir por palabra clave más larga (> 4 chars)
  IF v_product_id IS NULL THEN
    DECLARE kw text;
    BEGIN
      SELECT word INTO kw
        FROM regexp_split_to_table(v_base_name, '\s+') AS word
       WHERE length(word) > 4
       ORDER BY length(word) DESC
       LIMIT 1;

      IF kw IS NOT NULL THEN
        SELECT id INTO v_product_id
          FROM products
         WHERE name ILIKE '%' || kw || '%'
         ORDER BY length(name)
         LIMIT 1;
      END IF;
    END;
  END IF;

  IF v_product_id IS NULL THEN
    RAISE WARNING 'handle_order_item_stock_decrement: product not found for "%"', NEW.product_name;
    RETURN NEW;
  END IF;

  UPDATE products
     SET stock = GREATEST(0, stock - NEW.quantity)
   WHERE id = v_product_id;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_order_item_stock_decrement IS
  'Trigger function: resta stock al insertar un order_item. SECURITY DEFINER bypasses RLS.';

-- ── Trigger en order_items ────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_order_item_stock ON public.order_items;

CREATE TRIGGER trg_order_item_stock
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_item_stock_decrement();

COMMENT ON TRIGGER trg_order_item_stock ON public.order_items IS
  'Reduce el stock del producto correspondiente al insertar un artículo de pedido.';
