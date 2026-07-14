-- ============================================================================
-- RapiPizza — Diagnóstico del estado actual de order_items
-- Ejecutar en: https://supabase.com/dashboard/project/wdiflamxurlzstyicdma/sql/new
-- ============================================================================

-- 1. Ver qué políticas RLS existen actualmente en order_items
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'order_items'
ORDER BY cmd, policyname;

-- 2. Ver pedidos con y sin items
SELECT
  o.order_number,
  o.customer_name,
  o.status,
  o.total,
  o.created_at::date AS fecha,
  COUNT(oi.id) AS items_en_bd
FROM public.orders o
LEFT JOIN public.order_items oi ON oi.order_id = o.id
GROUP BY o.id, o.order_number, o.customer_name, o.status, o.total, o.created_at
ORDER BY o.created_at DESC
LIMIT 20;

-- 3. Ver columnas actuales de order_items
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'order_items'
ORDER BY ordinal_position;
