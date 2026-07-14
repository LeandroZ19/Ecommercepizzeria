-- ============================================================================
-- RapiPizza — Actualizar promoción de Martes a "Martes de Locura -40%"
-- File: 008_promotions_martes_locura.sql
--
-- Ejecutar en: https://supabase.com/dashboard/project/wdiflamxurlzstyicdma/sql/new
-- ============================================================================

-- Actualizar si ya existe la promoción del martes
UPDATE public.promotions
SET
  name        = 'Martes de Locura -40%',
  description = '¡Todos los martes, 40% de descuento en TODA tu compra! Sin código, sin restricciones.',
  discount    = 40,
  details     = 'Aplica a toda la carta: pizzas, combos, bebidas y acompañamientos.',
  updated_at  = NOW()
WHERE day_of_week = 2
  AND type = 'daily';

-- Insertar si no existe
INSERT INTO public.promotions (name, description, discount, image, type, day_of_week, active, sort_order, details)
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
  SELECT 1 FROM public.promotions WHERE day_of_week = 2 AND type = 'daily'
);

-- Desactivar otras promociones duplicadas del martes si las hay
UPDATE public.promotions
SET active = false
WHERE day_of_week = 2
  AND type = 'daily'
  AND name <> 'Martes de Locura -40%';
