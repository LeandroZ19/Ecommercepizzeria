-- =============================================================================
-- Migration 004: Pizza Sizes, Pizza Ingredients & Drinks
-- =============================================================================
-- Creates:
--   - pizza_sizes       : size options (Personal / Mediana / Familiar)
--   - pizza_ingredients : full ingredient catalogue for pizza customization
-- Updates:
--   - products          : inserts drink products (Pepsi, Coca Cola, Inca Cola,
--                         Chicha Morada, Limonada)
--
-- Both new tables have RLS enabled with a public SELECT policy so the
-- React frontend can read them without authentication.
--
-- The seed statements are idempotent (ON CONFLICT DO UPDATE) so this
-- migration is safe to run multiple times.
-- =============================================================================

-- ─── 1. pizza_sizes ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pizza_sizes (
  id         TEXT        PRIMARY KEY,
  name       TEXT        NOT NULL,
  diameter   TEXT        NOT NULL,
  slices     INT         NOT NULL,
  price      NUMERIC     NOT NULL,
  sort_order INT         NOT NULL DEFAULT 0,
  active     BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pizza_sizes ENABLE ROW LEVEL SECURITY;

-- Public read policy (no authentication required)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'pizza_sizes' AND schemaname = 'public'
      AND policyname = 'pizza_sizes_public_select'
  ) THEN
    CREATE POLICY pizza_sizes_public_select
      ON public.pizza_sizes
      FOR SELECT
      USING (true);
  END IF;
END
$$;

-- Seed pizza sizes
INSERT INTO public.pizza_sizes (id, name, diameter, slices, price, sort_order)
VALUES
  ('small',  'Personal', '25cm', 4, 15.00, 1),
  ('medium', 'Mediana',  '30cm', 6, 20.00, 2),
  ('large',  'Familiar', '35cm', 8, 25.00, 3)
ON CONFLICT (id) DO UPDATE SET
  name       = EXCLUDED.name,
  diameter   = EXCLUDED.diameter,
  slices     = EXCLUDED.slices,
  price      = EXCLUDED.price,
  sort_order = EXCLUDED.sort_order;

-- ─── 2. pizza_ingredients ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pizza_ingredients (
  id         TEXT        PRIMARY KEY,
  name       TEXT        NOT NULL,
  category   TEXT        NOT NULL
             CHECK (category IN ('base','sauce','cheese','meat','vegetable','extra')),
  price      NUMERIC     NOT NULL DEFAULT 0,
  image      TEXT,
  active     BOOLEAN     NOT NULL DEFAULT true,
  sort_order INT         NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pizza_ingredients ENABLE ROW LEVEL SECURITY;

-- Public read policy (no authentication required)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'pizza_ingredients' AND schemaname = 'public'
      AND policyname = 'pizza_ingredients_public_select'
  ) THEN
    CREATE POLICY pizza_ingredients_public_select
      ON public.pizza_ingredients
      FOR SELECT
      USING (true);
  END IF;
END
$$;

-- ─── Seed: Bases ─────────────────────────────────────────────────────────────
INSERT INTO public.pizza_ingredients (id, name, category, price, image, sort_order)
VALUES
  (
    'base-classic',
    'Masa Clasica',
    'base',
    0,
    'https://images.ecestaticos.com/PfcZ_EUaqmnqy_9k6dNdS2356UA=/189x33:1847x1276/1200x899/filters:fill(white):format(jpg)/f.elconfidencial.com%2Foriginal%2F9e0%2F49f%2F953%2F9e049f95341469b90655f40109d0ebe7.jpg',
    1
  ),
  (
    'base-thin',
    'Masa Delgada',
    'base',
    0,
    'https://www.aporpizza.es/wp-content/uploads/2019/05/Masa-fina-o-masa-gruesa-fina-1024x640.jpg',
    2
  ),
  (
    'base-thick',
    'Masa Gruesa',
    'base',
    2,
    'https://i.ytimg.com/vi/cYLXQ2yUrVk/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAKmw8jKynwMNWEQLzOhZWcMg4gIw',
    3
  ),
  (
    'base-integral',
    'Masa Integral',
    'base',
    3,
    'https://gourmet.iprospect.cl/wp-content/uploads/2012/06/pizza-masa-integral.jpg',
    4
  )
ON CONFLICT (id) DO UPDATE SET
  name       = EXCLUDED.name,
  category   = EXCLUDED.category,
  price      = EXCLUDED.price,
  image      = EXCLUDED.image,
  sort_order = EXCLUDED.sort_order;

-- ─── Seed: Salsas ─────────────────────────────────────────────────────────────
INSERT INTO public.pizza_ingredients (id, name, category, price, image, sort_order)
VALUES
  (
    'sauce-tomato',
    'Salsa de Tomate',
    'sauce',
    0,
    'https://recetinas.com/wp-content/uploads/2020/03/salsa-de-tomate.jpg',
    1
  ),
  (
    'sauce-bbq',
    'Salsa BBQ',
    'sauce',
    2,
    'https://www.aceitesdeolivadeespana.com/wp-content/uploads/2023/07/AdobeStock_271099773-1.jpeg',
    2
  ),
  (
    'sauce-cream',
    'Salsa de Crema',
    'sauce',
    2,
    'https://vod-hogarmania.atresmedia.com/hogarmania/images/images01/2013/06/11/5c0019675a2c110001775443/1239x697.jpg',
    3
  ),
  (
    'sauce-pesto',
    'Salsa Pesto',
    'sauce',
    3,
    'https://www.cuerpomente.com/medio/2024/02/08/salsa-pesto-receta_263bea85_240208124611_1280x720.jpg',
    4
  )
ON CONFLICT (id) DO UPDATE SET
  name       = EXCLUDED.name,
  category   = EXCLUDED.category,
  price      = EXCLUDED.price,
  image      = EXCLUDED.image,
  sort_order = EXCLUDED.sort_order;

-- ─── Seed: Quesos ─────────────────────────────────────────────────────────────
INSERT INTO public.pizza_ingredients (id, name, category, price, image, sort_order)
VALUES
  (
    'cheese-mozzarella',
    'Mozzarella',
    'cheese',
    0,
    'https://www.seriouseats.com/thmb/0LrG8tB4BkzQarr2fqrpykcaDBg=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/__opt__aboutcom__coeus__resources__content_migration__serious_eats__seriouseats.com__recipes__images__2015__10__20151017-pies-vicky-wasik-2-6f491edb6065485a86d6af639a592298.jpg',
    1
  ),
  (
    'cheese-parmesan',
    'Parmesano',
    'cheese',
    3,
    'https://www.lacasadelqueso.com.ar/wp-content/uploads/2017/08/parmigiano-reggiano.jpg',
    2
  ),
  (
    'cheese-gorgonzola',
    'Gorgonzola',
    'cheese',
    4,
    'https://www.lacasadelqueso.com.ar/wp-content/uploads/2017/08/queso-gorgonzola.jpg',
    3
  ),
  (
    'cheese-goat',
    'Queso de Cabra',
    'cheese',
    4,
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdSC0GsKi-eIRu6EkbqRnacTtrkFtP9Fa6MA&s',
    4
  )
ON CONFLICT (id) DO UPDATE SET
  name       = EXCLUDED.name,
  category   = EXCLUDED.category,
  price      = EXCLUDED.price,
  image      = EXCLUDED.image,
  sort_order = EXCLUDED.sort_order;

-- ─── Seed: Carnes ─────────────────────────────────────────────────────────────
INSERT INTO public.pizza_ingredients (id, name, category, price, image, sort_order)
VALUES
  (
    'meat-pepperoni',
    'Pepperoni',
    'meat',
    4,
    'https://www.ctifoods.com/wp-content/uploads/2025/06/pepperoni-liguria-rustico-copy-1.png',
    1
  ),
  (
    'meat-ham',
    'Jamon',
    'meat',
    3,
    'https://www.macafri.com/web/image/product.product/1038/image_1024/%5B78621155706003%5D%20Jamon%20de%20pierna%20rebanado%20200%20g?unique=da5fa90',
    2
  ),
  (
    'meat-bacon',
    'Tocino',
    'meat',
    4,
    'https://listonic.com/phimageproxy/listonic/products/bacon_bits.webp',
    3
  ),
  (
    'meat-sausage',
    'Salchicha Italiana',
    'meat',
    4,
    'https://st2.depositphotos.com/33365862/87754/p/450/depositphotos_877544782-stock-photo-piece-homemade-sausage-isolated-white.png',
    4
  ),
  (
    'meat-chicken',
    'Pollo',
    'meat',
    4,
    'https://png.pngtree.com/png-clipart/20250105/original/pngtree-fine-strips-of-shredded-chicken-perfect-for-culinary-recipe-and-food-png-image_20078081.png',
    5
  )
ON CONFLICT (id) DO UPDATE SET
  name       = EXCLUDED.name,
  category   = EXCLUDED.category,
  price      = EXCLUDED.price,
  image      = EXCLUDED.image,
  sort_order = EXCLUDED.sort_order;

-- ─── Seed: Vegetales ──────────────────────────────────────────────────────────
INSERT INTO public.pizza_ingredients (id, name, category, price, image, sort_order)
VALUES
  (
    'veg-mushroom',
    'Champinones',
    'vegetable',
    2,
    'https://png.pngtree.com/png-clipart/20250118/original/pngtree-mushrooms-png-image_19928814.png',
    1
  ),
  (
    'veg-onion',
    'Cebolla',
    'vegetable',
    1,
    'https://www.lopezcastro.com/wp-content/uploads/cebolla-aros.png',
    2
  ),
  (
    'veg-pepper',
    'Pimientos',
    'vegetable',
    2,
    'https://covemed21.es/wp-content/uploads/2025/11/pimientos-3-1024x1024.png',
    3
  ),
  (
    'veg-olive',
    'Aceitunas',
    'vegetable',
    2,
    'https://tekla-cbg.s3.eu-west-3.amazonaws.com/images/large/3586000_CBG_RECURSO_fe9301bfa0.png',
    4
  ),
  (
    'veg-tomato',
    'Tomate',
    'vegetable',
    2,
    'https://png.pngtree.com/png-clipart/20240306/original/pngtree-fresh-slice-of-tomato-png-image_14526186.png',
    5
  ),
  (
    'veg-pineapple',
    'Pina',
    'vegetable',
    2,
    'https://png.pngtree.com/png-clipart/20240921/original/pngtree-pineapple-ring-slices-png-image_16051259.png',
    6
  ),
  (
    'veg-spinach',
    'Espinaca',
    'vegetable',
    2,
    'https://static.vecteezy.com/system/resources/previews/010/984/759/non_2x/fresh-green-spinach-leaf-basil-cut-out-png.png',
    7
  )
ON CONFLICT (id) DO UPDATE SET
  name       = EXCLUDED.name,
  category   = EXCLUDED.category,
  price      = EXCLUDED.price,
  image      = EXCLUDED.image,
  sort_order = EXCLUDED.sort_order;

-- ─── Seed: Extras ─────────────────────────────────────────────────────────────
INSERT INTO public.pizza_ingredients (id, name, category, price, image, sort_order)
VALUES
  (
    'extra-basil',
    'Albahaca Fresca',
    'extra',
    1,
    'https://www.comato.cl/wp-content/uploads/2024/11/albahaca_comato__-300x300.png',
    1
  ),
  (
    'extra-oregano',
    'Oregano',
    'extra',
    0,
    'https://paprimur.es/wp-content/uploads/2024/03/OREGANO.png',
    2
  ),
  (
    'extra-garlic',
    'Ajo',
    'extra',
    1,
    'https://bcfoods.com/wp-content/uploads/2025/07/chopped-garlic_web2025.png',
    3
  ),
  (
    'extra-chili',
    'Chile',
    'extra',
    1,
    'https://static.vecteezy.com/system/resources/thumbnails/070/053/272/small/vibrant-green-chili-and-sliced-segments-isolated-on-transparent-png.png',
    4
  )
ON CONFLICT (id) DO UPDATE SET
  name       = EXCLUDED.name,
  category   = EXCLUDED.category,
  price      = EXCLUDED.price,
  image      = EXCLUDED.image,
  sort_order = EXCLUDED.sort_order;

-- ─── 3. Drinks — inserted into the products table ─────────────────────────────
-- The products table was created in migration 002_complete_schema.sql.
-- These rows use the same column names as the existing product rows.

INSERT INTO products (id, name, description, price, image, category, subcategory, popular, active)
VALUES
  (
    'drink-pepsi-1-5l',
    'Pepsi 1.5L',
    'Bebida gaseosa Pepsi refrescante',
    5.50,
    'https://algomaracucho.pe/70-thickbox_default/pepsi-15-litros.jpg',
    'drink',
    'drink',
    false,
    true
  ),
  (
    'drink-coca-1-5l',
    'Coca Cola 1.5L',
    'La bebida mas popular del mundo',
    7.50,
    'https://fonowaska.com/wp-content/uploads/2023/11/Coca-Cola-1.5Lt-1.jpg',
    'drink',
    'drink',
    false,
    true
  ),
  (
    'drink-inca-1-5l',
    'Inca Cola 1.5L',
    'La bebida de sabor nacional',
    6.90,
    'https://tofuu.getjusto.com/orioneat-local/resized2/wTwwxkNAZfqbXeabW-800-x.webp',
    'drink',
    'drink',
    false,
    true
  ),
  (
    'drink-chicha-1-5l',
    'Chicha Morada 1.5L',
    'Refrescante chicha morada artesanal',
    16.90,
    'https://tofuu.getjusto.com/orioneat-local/resized2/GSvs9QzhNZPwFduu5-300-x.webp',
    'drink',
    'drink',
    false,
    true
  ),
  (
    'drink-limonada-1-5l',
    'Limonada 1.5L',
    'Limonada fresca de la casa',
    16.90,
    'https://tofuu.getjusto.com/orioneat-local/resized2/JnTGXThFck6FZ2Yj9-300-x.webp',
    'drink',
    'drink',
    false,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  price       = EXCLUDED.price,
  image       = EXCLUDED.image,
  category    = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  popular     = EXCLUDED.popular,
  active      = EXCLUDED.active;
