-- ============================================================
-- RapiPizza — Esquema de base de datos
-- Ejecutar en: https://supabase.com/dashboard/project/wdiflamxurlzstyicdma/sql/new
-- ============================================================

-- ── Perfiles de usuario (extiende auth.users) ─────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name        TEXT,
  phone       TEXT,
  address     TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfil visible solo por el dueño"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Perfil editable solo por el dueño"
  ON public.profiles FOR ALL
  USING (auth.uid() = id);

-- Trigger: crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── Pedidos ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status          TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending','preparing','sent','delivered','cancelled')),
  total           DECIMAL(10,2) NOT NULL,
  delivery_fee    DECIMAL(10,2) DEFAULT 0,
  district        TEXT,
  delivery_type   TEXT DEFAULT 'delivery' CHECK (delivery_type IN ('delivery','pickup')),
  payment_method  TEXT DEFAULT 'card'     CHECK (payment_method IN ('card','cash')),
  address         TEXT,
  coupon_code     TEXT,
  discount        DECIMAL(10,2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pedidos visibles por su dueño"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Pedidos creados por su dueño"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── Items de pedido ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id       UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id     TEXT NOT NULL,
  product_name   TEXT NOT NULL,
  product_image  TEXT,
  price          DECIMAL(10,2) NOT NULL,
  quantity       INTEGER DEFAULT 1
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Items visibles si el pedido es del usuario"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Items creados si el pedido es del usuario"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- ── Índices de rendimiento ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_user_id    ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
