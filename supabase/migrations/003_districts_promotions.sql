-- ============================================================================
-- RapiPizza — Districts & Promotions Schema
-- File: 003_districts_promotions.sql
--
-- Run AFTER 002_complete_schema.sql in the Supabase SQL Editor.
-- URL: https://supabase.com/dashboard/project/wdiflamxurlzstyicdma/sql/new
--
-- Tables added:
--   districts   - Delivery zones with fee and estimated delivery time
--   promotions  - All promotional campaigns (daily, combo, seasonal, coupon)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- DISTRICTS
-- Delivery zone configuration: name, fee and estimated time range.
-- Readable by everyone (public). Only service role can write.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.districts (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL UNIQUE,
  delivery_fee     NUMERIC(10,2) NOT NULL DEFAULT 0,
  estimated_min    INTEGER     NOT NULL DEFAULT 25,  -- minutes
  estimated_max    INTEGER     NOT NULL DEFAULT 45,  -- minutes
  active           BOOLEAN     NOT NULL DEFAULT true,
  sort_order       INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.districts              IS 'Delivery zone configuration with fees and ETAs';
COMMENT ON COLUMN public.districts.delivery_fee IS 'Cost in PEN (Peruvian Sol) charged for delivery to this district';
COMMENT ON COLUMN public.districts.estimated_min IS 'Lower bound of estimated delivery time in minutes';
COMMENT ON COLUMN public.districts.estimated_max IS 'Upper bound of estimated delivery time in minutes';

-- RLS: public read, no frontend writes
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Districts are publicly readable" ON public.districts;
CREATE POLICY "Districts are publicly readable"
  ON public.districts FOR SELECT USING (true);

-- Seed: all delivery districts for RapiPizza
INSERT INTO public.districts (name, delivery_fee, estimated_min, estimated_max, active, sort_order) VALUES
  ('Villa María del Triunfo', 0,  20, 30, true, 1),
  ('San Juan de Miraflores',  5,  25, 35, true, 2),
  ('Villa el Salvador',       5,  30, 40, true, 3),
  ('Barranco',                6,  25, 35, true, 4),
  ('Chorrillos',              6,  30, 40, true, 5),
  ('Miraflores',              7,  30, 40, true, 6),
  ('San Isidro',              7,  30, 40, true, 7),
  ('Ate',                     7,  30, 40, true, 8),
  ('Surco',                   8,  35, 45, true, 9),
  ('Santiago de Surco',       8,  35, 45, true, 10),
  ('San Borja',               8,  35, 45, true, 11),
  ('Lima Centro',             9,  35, 45, true, 12),
  ('San Juan de Lurigancho',  10, 40, 50, true, 13),
  ('La Molina',               10, 40, 50, true, 14)
ON CONFLICT (name) DO UPDATE SET
  delivery_fee  = EXCLUDED.delivery_fee,
  estimated_min = EXCLUDED.estimated_min,
  estimated_max = EXCLUDED.estimated_max,
  sort_order    = EXCLUDED.sort_order;

-- ----------------------------------------------------------------------------
-- PROMOTIONS
-- All promotional campaigns: daily deals, combos, seasonal and coupon codes.
-- Readable by everyone. Only service role can write.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.promotions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  description  TEXT        NOT NULL DEFAULT '',
  discount     INTEGER     NOT NULL DEFAULT 0,  -- percentage (0-100)
  image        TEXT,
  valid_until  DATE,
  code         TEXT,       -- coupon code (NULL if not a coupon)
  type         TEXT        NOT NULL DEFAULT 'coupon'
               CHECK (type IN ('daily','combo','seasonal','coupon')),
  details      TEXT,
  terms        TEXT[],     -- array of term strings
  day_of_week  INTEGER,    -- 0=Sunday … 6=Saturday (NULL if not day-specific)
  active       BOOLEAN     NOT NULL DEFAULT true,
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.promotions            IS 'Promotional campaigns: daily, combo, seasonal, coupon';
COMMENT ON COLUMN public.promotions.discount   IS 'Discount percentage (0-100)';
COMMENT ON COLUMN public.promotions.code       IS 'Coupon code redeemable at checkout; NULL for automatic promotions';
COMMENT ON COLUMN public.promotions.day_of_week IS '0=Sunday, 1=Monday … 6=Saturday; NULL means every day';
COMMENT ON COLUMN public.promotions.type       IS 'Category: daily=day-specific, combo=bundle deal, seasonal=time-limited, coupon=code-based';

-- RLS: public read
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Promotions are publicly readable" ON public.promotions;
CREATE POLICY "Promotions are publicly readable"
  ON public.promotions FOR SELECT USING (true);

-- Seed: all promotions
INSERT INTO public.promotions
  (name, description, discount, image, valid_until, code, type, details, terms, day_of_week, active, sort_order)
VALUES

-- ── OFERTAS DEL DÍA ─────────────────────────────────────────────────────────

('Martes de Pizza 2x1',
 '2x1 en todas las pizzas clasicas los martes',
 50,
 'https://images.rappi.pe/products/832b8fba-9420-4567-937a-1b94cc879441-1747724658545.png?d=600x600&e=webp',
 '2026-12-31', NULL, 'daily',
 'Valido solo los martes. Aplica para pizza americana y pepperoni en talla grande o familiar.',
 ARRAY['Solo martes','Pizzas americana y pepperoni','No acumulable con otros descuentos','Valido para delivery y recojo en tienda'],
 2, true, 1),

('Jueves de Combos',
 '30% de descuento en todos los Combos Rapilover los jueves',
 30,
 'https://images.rappi.pe/products/c0e14f36-76b2-4d70-a8eb-ea0583db26bd.png?d=600x600&e=webp',
 '2026-12-31', NULL, 'daily',
 'Los jueves disfruta de 30% de descuento en cualquier Combo Rapilover.',
 ARRAY['Solo jueves','Aplica para todos los Combos Rapilover','Descuento automatico','No requiere cupon'],
 4, true, 2),

('Viernes de Promos Extremas',
 'Promo Extrema 1 y 2 con 20% de descuento todos los viernes',
 20,
 'https://images.rappi.pe/products/862a7e98-31ad-4e30-9664-9f2b2eb233bc.jpeg?d=600x600&e=webp',
 '2026-12-31', NULL, 'daily',
 'Todos los viernes las Promos Extremas tienen 20% de descuento especial.',
 ARRAY['Solo viernes','Promo Extrema 1 y Promo Extrema 2','No acumulable'],
 5, true, 3),

-- ── COMBOS ESPECIALES ────────────────────────────────────────────────────────

('Combo Rapilover para Compartir',
 '3 pizzas grandes americana o pepperoni + Pepsi 1lt',
 20,
 'https://images.rappi.pe/products/42cf7930-4656-42f5-b286-7dd8030d1396-1747001856436.png?d=600x600&e=webp',
 '2026-12-31', 'FAMILIA25', 'combo',
 'El combo perfecto para compartir con familia o amigos. Usa el codigo FAMILIA25.',
 ARRAY['Incluye 3 pizzas grandes a eleccion','Incluye Pepsi 1lt','Usa el codigo FAMILIA25'],
 NULL, true, 4),

('Mega Combo Party',
 '4 pizzas grandes cualquier sabor + Pepsi 1lt',
 15,
 'https://images.rappi.pe/products/bf521e04-7f16-4fb4-b7d3-fb382f6d580e.png?d=600x600&e=webp',
 '2026-12-31', 'PARTY15', 'combo',
 'Ideal para fiestas y reuniones. 4 pizzas a eleccion con bebida incluida.',
 ARRAY['Incluye 4 pizzas grandes a eleccion','Incluye Pepsi 1lt','Usa el codigo PARTY15'],
 NULL, true, 5),

-- ── TEMPORADA ────────────────────────────────────────────────────────────────

('Promo Invierno 2026',
 '20% de descuento en todos los Combos Familiares del mes de julio',
 20,
 'https://images.rappi.pe/products/ab9a63fc-b0ba-4381-8e9b-e0a4da83baf8-1747002789734.png?d=600x600&e=webp',
 '2026-07-31', 'INVIERNO20', 'seasonal',
 'En este invierno calienta tu hogar con las mejores pizzas. 20% off en combos familiares durante julio.',
 ARRAY['Valido todo julio 2026','Aplica en Promo Rapilover Familiar y Promo Rapilover Familiar x2','Usa el codigo INVIERNO20','No acumulable con otras ofertas'],
 NULL, true, 6),

('Fiestas Patrias',
 '15% de descuento en todo el menu del 27 y 28 de julio',
 15,
 'https://images.rappi.pe/products/9107faff-6bb2-4202-885f-540d023a040e-1747002097125.png?d=600x600&e=webp',
 '2026-07-28', 'PERU15', 'seasonal',
 'Celebra las Fiestas Patrias con RapiPizza. 15% de descuento en cualquier producto del menu los dias 27 y 28 de julio.',
 ARRAY['Valido 27 y 28 de julio 2026','Aplica en todo el menu','Usa el codigo PERU15','Un uso por cliente'],
 NULL, true, 7),

('Promo Escolar',
 '10% de descuento en combos de 6 porciones para estudiantes universitarios',
 10,
 'https://images.rappi.pe/products/984d9bdb-b433-4821-b832-9073292e1e85-1747002692474.png?d=600x600&e=webp',
 '2026-12-31', 'ESCOLAR10', 'seasonal',
 'Especial para universitarios. Muestra tu carne universitaria al recoger en tienda o menciona el codigo en el pedido.',
 ARRAY['Aplica en Combos de 6 Porciones','Requiere carnet universitario vigente','Usa el codigo ESCOLAR10','Valido durante el ano academico 2026'],
 NULL, true, 8),

('Noche de Navidad',
 '25% de descuento en Promos Extremas para la temporada navidena',
 25,
 'https://images.rappi.pe/products/b85a3f6a-395b-469f-93e3-94988b511545.jpeg?d=600x600&e=webp',
 '2026-12-31', 'NAVIDAD25', 'seasonal',
 'Celebra la Navidad con la mejor pizza. 25% de descuento en las Promos Extremas durante diciembre.',
 ARRAY['Valido todo diciembre 2026','Aplica en Promo Extrema 1 y Promo Extrema 2','Usa el codigo NAVIDAD25','No acumulable'],
 NULL, true, 9),

-- ── CUPONES ──────────────────────────────────────────────────────────────────

('Primera Compra',
 '15% de descuento en tu primer pedido',
 15,
 'https://images.rappi.pe/products/832b8fba-9420-4567-937a-1b94cc879441-1747724658545.png?d=600x600&e=webp',
 '2026-12-31', 'PRIMERA', 'coupon',
 'Bienvenido a RapiPizza! Tu primer pedido tiene 15% de descuento automatico.',
 ARRAY['Solo para nuevos clientes','Usa el codigo PRIMERA','Valido una sola vez por cliente','Aplica en todo el menu'],
 NULL, true, 10),

('Happy Hour',
 '20% de descuento de 5pm a 7pm todos los dias',
 20,
 'https://images.rappi.pe/products/3a83e773-e011-4f2f-8366-d8c2f1f27c80.png?d=600x600&e=webp',
 '2026-12-31', 'HAPPY20', 'coupon',
 'Disfruta de 20% de descuento en horario feliz de 5:00 PM a 7:00 PM.',
 ARRAY['Valido de 5:00 PM a 7:00 PM','Todos los dias','Usa el codigo HAPPY20','Aplica para todo el menu'],
 NULL, true, 11),

('Descuento Especial',
 '10% de descuento en cualquier pedido del menu',
 10,
 'https://images.rappi.pe/products/e9949501-c241-4431-97ba-a5a349204cbc-1747002964338.png?d=600x600&e=webp',
 '2026-12-31', 'PROMO10', 'coupon',
 '10% de descuento aplicable a cualquier pedido del menu completo.',
 ARRAY['Aplica para todo el menu','Usa el codigo PROMO10','No acumulable con otras ofertas'],
 NULL, true, 12)

ON CONFLICT DO NOTHING;
