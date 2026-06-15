-- ============================================================================
-- RapiPizza — Complete Database Schema Migration
-- File: 002_complete_schema.sql
--
-- Creates all tables, RLS policies, triggers, and seeds product data.
-- Run this in the Supabase Dashboard SQL Editor.
--
-- Tables:
--   profiles              - User profile data extending auth.users
--   products              - Menu items catalog
--   product_variants      - Pizza size variants
--   orders                - Order headers
--   order_items           - Individual line items per order
--   custom_pizzas         - Custom-built pizza configurations
--   custom_pizza_toppings - Topping selections for custom pizzas
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PROFILES
-- Extends auth.users with additional user data (name, phone, address).
-- Auto-populated via trigger on auth.users insert.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT,
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.profiles              IS 'User profile data extending auth.users';
COMMENT ON COLUMN public.profiles.id           IS 'References auth.users(id)';
COMMENT ON COLUMN public.profiles.name         IS 'Full display name';
COMMENT ON COLUMN public.profiles.phone        IS 'Phone number for delivery contact';
COMMENT ON COLUMN public.profiles.address      IS 'Default delivery address';

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger: auto-create profile row when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, address)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- PRODUCTS
-- Master catalog of all menu items.
-- Public read access; only service role can write.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.products (
  id          TEXT        PRIMARY KEY,
  name        TEXT        NOT NULL,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  image       TEXT,
  category    TEXT,
  subcategory TEXT,
  popular     BOOLEAN     NOT NULL DEFAULT false,
  active      BOOLEAN     NOT NULL DEFAULT true,
  detail_id   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.products             IS 'Menu items catalog';
COMMENT ON COLUMN public.products.id          IS 'Stable text ID (e.g. rapilover-1)';
COMMENT ON COLUMN public.products.category    IS 'Top-level category: pizza, side';
COMMENT ON COLUMN public.products.subcategory IS 'Grouping within category';
COMMENT ON COLUMN public.products.popular     IS 'Featured/popular flag for homepage';
COMMENT ON COLUMN public.products.detail_id   IS 'Optional slug for product detail page routing';

-- RLS for products (public read, no write from frontend)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Products are publicly readable" ON public.products;

CREATE POLICY "Products are publicly readable"
  ON public.products FOR SELECT
  USING (true);

-- ----------------------------------------------------------------------------
-- PRODUCT VARIANTS
-- Size variants for pizzas (Personal, Mediana, Familiar).
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.product_variants (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  diameter   TEXT,
  slices     INTEGER,
  price      NUMERIC(10,2) NOT NULL DEFAULT 0,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.product_variants            IS 'Pizza size/variant options';
COMMENT ON COLUMN public.product_variants.product_id IS 'Parent product reference';
COMMENT ON COLUMN public.product_variants.sort_order IS 'Display sort order (ascending)';

-- RLS for product_variants (public read)
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Product variants are publicly readable" ON public.product_variants;

CREATE POLICY "Product variants are publicly readable"
  ON public.product_variants FOR SELECT
  USING (true);

-- ----------------------------------------------------------------------------
-- ORDERS
-- Order header records.
-- Users can read/create their own orders.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.orders (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status         TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','preparing','sent','delivered','cancelled')),
  total          NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal       NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee   NUMERIC(10,2) NOT NULL DEFAULT 0,
  district       TEXT,
  delivery_type  TEXT        NOT NULL DEFAULT 'delivery'
                             CHECK (delivery_type IN ('delivery','pickup')),
  payment_method TEXT        NOT NULL DEFAULT 'card'
                             CHECK (payment_method IN ('card','cash')),
  address        TEXT,
  coupon_code    TEXT,
  customer_name  TEXT,
  customer_phone TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.orders                IS 'Order header records';
COMMENT ON COLUMN public.orders.user_id        IS 'References the authenticated user';
COMMENT ON COLUMN public.orders.status         IS 'Order lifecycle status';
COMMENT ON COLUMN public.orders.subtotal       IS 'Sum of items before discounts';
COMMENT ON COLUMN public.orders.discount       IS 'Total discount amount from coupons';
COMMENT ON COLUMN public.orders.delivery_fee   IS '0 for pickup or free delivery districts';
COMMENT ON COLUMN public.orders.coupon_code    IS 'Applied coupon code if any';

-- RLS for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own orders"   ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;

CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- ORDER ITEMS
-- Line items belonging to an order.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.order_items (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id    TEXT,
  product_name  TEXT        NOT NULL,
  product_image TEXT,
  price         NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity      INTEGER     NOT NULL DEFAULT 1 CHECK (quantity > 0),
  subtotal      NUMERIC(10,2) NOT NULL DEFAULT 0,
  variant_name  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.order_items               IS 'Individual line items within an order';
COMMENT ON COLUMN public.order_items.product_id    IS 'References products(id); may be null for custom pizzas';
COMMENT ON COLUMN public.order_items.variant_name  IS 'Size name if a variant was selected';
COMMENT ON COLUMN public.order_items.subtotal      IS 'price * quantity';

-- RLS for order_items (readable if the parent order belongs to the user)
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own order items"   ON public.order_items;
DROP POLICY IF EXISTS "Users can create their own order items" ON public.order_items;

CREATE POLICY "Users can view their own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own order items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- CUSTOM PIZZAS
-- Records a fully custom-built pizza attached to an order_item.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.custom_pizzas (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID       REFERENCES public.order_items(id) ON DELETE SET NULL,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  size_id      TEXT,
  size_name    TEXT,
  base_id      TEXT,
  base_name    TEXT,
  sauce_id     TEXT,
  sauce_name   TEXT,
  cheese_id    TEXT,
  cheese_name  TEXT,
  total_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.custom_pizzas                IS 'Custom-built pizza configurations';
COMMENT ON COLUMN public.custom_pizzas.order_item_id  IS 'Linked order item (null if saved as draft)';
COMMENT ON COLUMN public.custom_pizzas.user_id        IS 'Owner of this custom pizza';

-- RLS for custom_pizzas
ALTER TABLE public.custom_pizzas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own custom pizzas"   ON public.custom_pizzas;
DROP POLICY IF EXISTS "Users can create their own custom pizzas" ON public.custom_pizzas;

CREATE POLICY "Users can view their own custom pizzas"
  ON public.custom_pizzas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom pizzas"
  ON public.custom_pizzas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- CUSTOM PIZZA TOPPINGS
-- Individual topping selections for a custom pizza.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.custom_pizza_toppings (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_pizza_id  UUID        NOT NULL REFERENCES public.custom_pizzas(id) ON DELETE CASCADE,
  ingredient_id    TEXT        NOT NULL,
  ingredient_name  TEXT        NOT NULL,
  category         TEXT,
  quantity         INTEGER     NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_per_unit   NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.custom_pizza_toppings                  IS 'Topping choices for a custom pizza';
COMMENT ON COLUMN public.custom_pizza_toppings.custom_pizza_id  IS 'Parent custom pizza';
COMMENT ON COLUMN public.custom_pizza_toppings.category         IS 'Ingredient category: base, sauce, cheese, topping';
COMMENT ON COLUMN public.custom_pizza_toppings.quantity         IS 'Amount of this topping (1-3)';

-- RLS for custom_pizza_toppings
ALTER TABLE public.custom_pizza_toppings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own custom pizza toppings"   ON public.custom_pizza_toppings;
DROP POLICY IF EXISTS "Users can create their own custom pizza toppings" ON public.custom_pizza_toppings;

CREATE POLICY "Users can view their own custom pizza toppings"
  ON public.custom_pizza_toppings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.custom_pizzas
      WHERE custom_pizzas.id = custom_pizza_toppings.custom_pizza_id
        AND custom_pizzas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own custom pizza toppings"
  ON public.custom_pizza_toppings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.custom_pizzas
      WHERE custom_pizzas.id = custom_pizza_toppings.custom_pizza_id
        AND custom_pizzas.user_id = auth.uid()
    )
  );

-- ============================================================================
-- SEED: All 30 Products
-- Insert all menu items into the products table.
-- Uses ON CONFLICT DO UPDATE to make this idempotent.
-- ============================================================================

INSERT INTO public.products (id, name, description, price, image, category, subcategory, popular, active, detail_id) VALUES

-- Combo Rapilover (4 items)
('rapilover-1', 'Combo Rapilover',
 'Pizza americana grande con pan al ajo (4 panecillos) y Pepsi 1lt',
 41.90, 'https://images.rappi.pe/products/c0e14f36-76b2-4d70-a8eb-ea0583db26bd.png?d=600x600&e=webp',
 'pizza', 'combo-rapilover', true, true, NULL),

('rapilover-2', 'Combo Pizza Doble',
 'Dos pizzas grandes cualquier sabor y Pepsi 1lt',
 56.90, 'https://images.rappi.pe/products/9107faff-6bb2-4202-885f-540d023a040e-1747002097125.png?d=600x600&e=webp',
 'pizza', 'combo-rapilover', true, true, NULL),

('rapilover-3', 'Combo Rapilover para Compartir',
 'Combo de 3 pizzas grandes: americana o pepperoni, acompanado de una Pepsi de 1 litro',
 70.90, 'https://images.rappi.pe/products/42cf7930-4656-42f5-b286-7dd8030d1396-1747001856436.png?d=600x600&e=webp',
 'pizza', 'combo-rapilover', true, true, NULL),

('rapilover-4', 'Combo Rapilover 4U Para Ti',
 '4 Pizzas grandes cualquier sabor y Pepsi 1lt',
 98.90, 'https://images.rappi.pe/products/bf521e04-7f16-4fb4-b7d3-fb382f6d580e.png?d=600x600&e=webp',
 'pizza', 'combo-rapilover', false, true, NULL),

-- Promo Ame y Peppe (2 items)
('ame-peppe-1', 'Pizza Americana',
 'Pizza americana con masa artesanal, queso mozzarella y jamon',
 25.90, 'https://images.rappi.pe/products/832b8fba-9420-4567-937a-1b94cc879441-1747724658545.png?d=600x600&e=webp',
 'pizza', 'promo-ame-peppe', true, true, 'pizza-americana'),

('ame-peppe-2', 'Pizza Pepperoni',
 'Pizza con queso mozzarella y pepperoni sobre masa tradicional',
 25.90, 'https://images.rappi.pe/products/1560b4e5-3468-4b31-804b-9657b4aa3d72-1747724630621.png?d=600x600&e=webp',
 'pizza', 'promo-ame-peppe', true, true, 'pizza-pepperoni-detail'),

-- Promo Rapilover (4 items)
('promo-rap-1', 'Promo Rapilover Familiar',
 'Pizza americana familiar con pan al ajo (8 panecillos) con Inca Kola o Coca Cola 1.5lt',
 52.90, 'https://images.rappi.pe/products/ab9a63fc-b0ba-4381-8e9b-e0a4da83baf8-1747002789734.png?d=600x600&e=webp',
 'pizza', 'promo-rapilover', true, true, NULL),

('promo-rap-2', 'Promo Rapilover Tri Clasico',
 '3 Pizzas familiares clasicas con pepperoni y jamon',
 79.90, 'https://images.rappi.pe/products/50133948-3489-4415-ae60-4301ba3911d2.png?d=600x600&e=webp',
 'pizza', 'promo-rapilover', false, true, NULL),

('promo-rap-3', 'Promo Rapilover Familiar x2',
 '2 Pizzas familiares con pan al ajo (8 panecillos) con Inca Kola o Coca Cola 1.5lt',
 84.90, 'https://images.rappi.pe/products/370006fd-a9e2-4bd9-bced-0ce573a8d081.png?d=600x600&e=webp',
 'pizza', 'promo-rapilover', false, true, NULL),

('promo-rap-4', 'Promo Tridente Supremo',
 '3 Pizzas familiares cualquier sabor con Inca Kola o Coca Cola 1.5lt',
 95.90, 'https://images.rappi.pe/products/3a83e773-e011-4f2f-8366-d8c2f1f27c80.png?d=600x600&e=webp',
 'pizza', 'promo-rapilover', false, true, NULL),

-- Pizza Personal (1 item)
('personal-1', 'Pizza Personal Cualquier Sabor',
 'Pizza personal: americana, pepperoni, hawaiana, vegetariana, pepperoni especial, carnivora, mixta, alemana y carnivora tropical',
 12.00, 'https://images.rappi.pe/products/320841f3-8f3a-4e6b-8c74-e6d0ee336e74-1749449497711.png?d=600x600&e=webp',
 'pizza', 'pizza-personal', true, true, NULL),

-- Pizza Doble (1 item)
('doble-1', 'Pizzas Clasicas x2',
 'Disfruta de 2 pizzas clasicas grandes o familiares: americana, pepperoni o hawaiana',
 46.90, 'https://images.rappi.pe/products/f49eb908-16a7-4553-af0a-1b0df3981ee7.png?d=600x600&e=webp',
 'pizza', 'pizza-doble', false, true, NULL),

-- Combos 6 Porciones (6 items)
('combo6-1', 'Combo 1',
 'Pizza americana grande, pan al ajo (4 panecillos) y Pepsi 1lt',
 39.90, 'https://images.rappi.pe/products/984d9bdb-b433-4821-b832-9073292e1e85-1747002692474.png?d=600x600&e=webp',
 'pizza', 'combo-6', true, true, NULL),

('combo6-2', 'Combo 2',
 'Dos pizzas grandes: pepperoni y americana',
 48.90, 'https://images.rappi.pe/products/1933ab84-ab18-47d8-823d-a6d5fab2cf43-1747006638560.png?d=600x600&e=webp',
 'pizza', 'combo-6', false, true, NULL),

('combo6-3', 'Combo 3',
 'Dos pizzas grandes cualquier sabor y Pepsi 1lt',
 55.90, 'https://images.rappi.pe/products/9107faff-6bb2-4202-885f-540d023a040e-1747002097125.png?d=600x600&e=webp',
 'pizza', 'combo-6', false, true, NULL),

('combo6-4', 'Combo 4',
 'Tres pizzas grandes: dos de americana y una de pepperoni, con Pepsi de 1 litro',
 64.90, 'https://images.rappi.pe/products/42cf7930-4656-42f5-b286-7dd8030d1396-1747001856436.png?d=600x600&e=webp',
 'pizza', 'combo-6', false, true, NULL),

('combo6-5', 'Combo 5',
 'Pizza grande cualquier sabor, pan al ajo (4 panecillos) y Pepsi 1lt',
 43.90, 'https://images.rappi.pe/products/ec21b73d-1183-4a2f-ae4d-0f39700cb60d-1747002490408.png?d=600x600&e=webp',
 'pizza', 'combo-6', false, true, NULL),

('combo6-6', 'Combo 6',
 'Cuatro pizzas grandes de cualquier sabor y una Pepsi de 1 litro',
 92.90, 'https://images.rappi.pe/products/d401dbdc-fc1f-4582-a36c-d8cefca6803e-1747002433139.png?d=600x600&e=webp',
 'pizza', 'combo-6', false, true, NULL),

-- Promos 8 Porciones (7 items)
('promo8-1', 'Promo 1',
 'Pizza americana familiar, pan al ajo (8 panecillos) con Inca Cola o Coca Cola 1.5lt',
 51.90, 'https://images.rappi.pe/products/ab9a63fc-b0ba-4381-8e9b-e0a4da83baf8-1747002789734.png?d=600x600&e=webp',
 'pizza', 'promo-8', true, true, NULL),

('promo8-2', 'Promo 2',
 'Dos pizzas familiares: una con pepperoni y otra con pepperoni y carne',
 64.00, 'https://images.rappi.pe/products/a440c439-c1d4-496f-8d12-4605a974dd7b-1747002914032.png?d=600x600&e=webp',
 'pizza', 'promo-8', false, true, NULL),

('promo8-3', 'Promo 3',
 'Tres pizzas familiares clasicas con pepperoni',
 77.00, 'https://images.rappi.pe/products/e9949501-c241-4431-97ba-a5a349204cbc-1747002964338.png?d=600x600&e=webp',
 'pizza', 'promo-8', false, true, NULL),

('promo8-4', 'Promo 4',
 'Pizza especial familiar, pan al ajo (8 panecillos) con Inca Cola o Coca Cola 1.5lt',
 55.90, 'https://images.rappi.pe/products/d9352c4f-5f86-4cf8-b852-bd3563bcca4e-1747003044407.png?d=600x600&e=webp',
 'pizza', 'promo-8', false, true, NULL),

('promo8-5', 'Promo 5',
 'Dos pizzas familiares: americana o pepperoni, con Inca Kola o Coca Cola de 1.5 litros',
 71.90, 'https://images.rappi.pe/products/49756c04-9df9-418b-8376-423416b4eb0c-1747003074329.png?d=600x600&e=webp',
 'pizza', 'promo-8', false, true, NULL),

('promo8-6', 'Promo 6',
 'Dos pizzas familiares especiales, pan al ajo (8 panecillos) y bebida de 1.5lt',
 84.90, 'https://images.rappi.pe/products/a83dc137-75f9-4ce8-a3fb-8dbf29b90f35-1747003109877.png?d=600x600&e=webp',
 'pizza', 'promo-8', false, true, NULL),

('promo8-7', 'Promo 7',
 'Tres pizzas familiares cualquier sabor con Inca Cola o Coca Cola 1.5lt',
 96.90, 'https://images.rappi.pe/products/625b75c5-d5e7-40cb-b61e-d23cad5a7a7c-1747003183340.png?d=600x600&e=webp',
 'pizza', 'promo-8', false, true, NULL),

-- Promos Extremas (2 items)
('extreme-1', 'Promo Extrema 1',
 'Pizza extrema (8 ingredientes y extra queso) de 8 porciones, pan al ajo (8 panecillos), Inca Cola o Coca Cola',
 59.90, 'https://images.rappi.pe/products/862a7e98-31ad-4e30-9664-9f2b2eb233bc.jpeg?d=600x600&e=webp',
 'pizza', 'promo-extrema', true, true, NULL),

('extreme-2', 'Promo Extrema 2',
 'Dos pizzas extremas (8 ingredientes y extra queso) de 8 porciones, pan al ajo (8 panecillos), Inca Kola o Coca Cola 1.5lt',
 88.90, 'https://images.rappi.pe/products/b85a3f6a-395b-469f-93e3-94988b511545.jpeg?d=600x600&e=webp',
 'pizza', 'promo-extrema', false, true, NULL),

-- Complementos (3 items)
('comp-1', 'Pan al Ajo Tradicional',
 'Pan artesanal con mantequilla al ajo (8 panecillos)',
 10.90, 'https://images.rappi.pe/products/gp_sides_otra_pan_al_ajo_n.png?d=600x600&e=webp',
 'side', 'complemento', true, true, NULL),

('comp-2', 'Pan al Ajo Especial',
 'Pan artesanal con mantequilla al ajo, queso cheddar y 100g de queso mozzarella (8 panecillos)',
 15.90, 'https://images.rappi.pe/products/f72ad1e4-adf7-4ae9-b50e-d1353ffa018b.jpeg?d=600x600&e=webp',
 'side', 'complemento', false, true, NULL),

('comp-3', 'Crema Rapipizza',
 '2 tapecitos extra de crema de rocoto',
 3.00, 'https://images.rappi.pe/products/792a436e-8dc1-422f-87c5-d5abfc8e7b3c-1749448057134.png?d=600x600&e=webp',
 'side', 'complemento', false, true, NULL)

ON CONFLICT (id) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  price       = EXCLUDED.price,
  image       = EXCLUDED.image,
  category    = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  popular     = EXCLUDED.popular,
  active      = EXCLUDED.active,
  detail_id   = EXCLUDED.detail_id;
