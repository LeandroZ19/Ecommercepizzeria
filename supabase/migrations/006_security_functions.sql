-- ============================================================================
-- RapiPizza — Funciones SECURITY DEFINER para operaciones sin restricción RLS
-- File: 006_security_functions.sql
--
-- Ejecutar en: https://supabase.com/dashboard/project/wdiflamxurlzstyicdma/sql/new
-- Ejecutar DESPUÉS de 005.
--
-- Por qué necesitamos esto:
--   - El cliente usa el JWT del usuario (rol customer/admin/delivery)
--   - Los clientes NO pueden ver pedidos de otros → cola virtual siempre #1
--   - Los clientes NO pueden actualizar productos → stock nunca se resta
--   - SECURITY DEFINER ejecuta la función con privilegios del owner (postgres)
--     sin importar quién la llame
-- ============================================================================

-- ── 1. Posición en la cola virtual ───────────────────────────────────────────

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

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_order_number IS NOT NULL THEN
    -- Contar pedidos activos con número de orden menor al actual
    SELECT COUNT(*) + 1
      INTO v_position
      FROM orders
     WHERE status IN ('pending', 'preparing')
       AND order_number < v_order_number;
  ELSE
    -- Fallback por fecha de creación
    SELECT COUNT(*) + 1
      INTO v_position
      FROM orders
     WHERE status IN ('pending', 'preparing')
       AND created_at < v_created_at;
  END IF;

  RETURN v_position;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_queue_position(uuid) TO anon, authenticated;

COMMENT ON FUNCTION public.get_queue_position IS
  'Retorna la posición del pedido en la cola activa (pending/preparing). Bypasses RLS.';

-- ── 2. Reducción de stock al confirmar pedido ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.decrement_product_stock(
  p_product_name text,
  p_amount       integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id uuid;
  v_base_name  text;
BEGIN
  -- Quitar sufijo de tamaño "(Mediana)", "(Grande)", etc.
  v_base_name := regexp_replace(p_product_name, '\s*\(.*\)\s*$', '', 'i');
  v_base_name := trim(v_base_name);

  -- 1. Coincidencia exacta (case-insensitive)
  SELECT id INTO v_product_id
    FROM products
   WHERE name ILIKE v_base_name
   LIMIT 1;

  -- 2. Coincidencia parcial %nombre%
  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id
      FROM products
     WHERE name ILIKE '%' || v_base_name || '%'
     ORDER BY length(name)
     LIMIT 1;
  END IF;

  -- 3. Coincidencia por palabra clave más larga del nombre
  IF v_product_id IS NULL THEN
    DECLARE
      v_keyword text;
    BEGIN
      SELECT word INTO v_keyword
        FROM regexp_split_to_table(v_base_name, '\s+') AS word
       WHERE length(word) > 4
       LIMIT 1;

      IF v_keyword IS NOT NULL THEN
        SELECT id INTO v_product_id
          FROM products
         WHERE name ILIKE '%' || v_keyword || '%'
         ORDER BY length(name)
         LIMIT 1;
      END IF;
    END;
  END IF;

  IF v_product_id IS NULL THEN
    RAISE WARNING 'decrement_product_stock: product not found for "%"', p_product_name;
    RETURN false;
  END IF;

  UPDATE products
     SET stock = GREATEST(0, stock - p_amount)
   WHERE id = v_product_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_product_stock(text, integer) TO anon, authenticated;

COMMENT ON FUNCTION public.decrement_product_stock IS
  'Resta stock al producto buscando por nombre (varios fallbacks). Bypasses RLS para clientes.';
