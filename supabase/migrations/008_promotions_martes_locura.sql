-- ============================================================================
-- RapiPizza — Actualizar promoción de Martes a "Martes de Locura -40%"
-- File: 008_promotions_martes_locura.sql
--
-- Ejecutar en: https://supabase.com/dashboard/project/wdiflamxurlzstyicdma/sql/new
--
-- NOTA: La tabla promotions NO tiene columna updated_at.
-- ============================================================================

-- 1. Actualizar si ya existe una promoción del martes (día 2)
UPDATE public.promotions
SET
  name        = 'Martes de Locura -40%',
  description = '¡Todos los martes, 40% de descuento en TODA tu compra! Sin código, sin restricciones.',
  discount    = 40,
  details     = 'Aplica a toda la carta: pizzas, combos, bebidas y acompañamientos.',
  active      = true
WHERE day_of_week = 2
  AND type = 'daily';

-- 2. Si no existe ninguna del martes, insertarla
INSERT INTO public.promotions
  (name, description, discount, image, type, day_of_week, active, sort_order, details)
SELECT
  'Martes de Locura -40%',
  '¡Todos los martes, 40% de descuento en TODA tu compra! Sin código, sin restricciones.',
  40,
  NULL,
  'daily',
  2,
  true,
  1,
  'Aplica a toda la carta: pizzas, combos, bebidas y acompañamientos.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.promotions
  WHERE day_of_week = 2 AND type = 'daily'
);

-- 3. Verificar resultado
SELECT id, name, discount, day_of_week, active
FROM public.promotions
WHERE day_of_week = 2;
