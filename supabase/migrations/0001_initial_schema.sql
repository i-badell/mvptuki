-- Migration: Initial schema for Festival Food & Drink Ordering
-- Feature: 001-festival-order-flow
-- See: specs/001-festival-order-flow/data-model.md for full documentation

-- ─── Enums ─────────────────────────────────────────────────────────────────

CREATE TYPE order_status AS ENUM (
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'collected',
  'cancelled'
);

CREATE TYPE vendor_status AS ENUM (
  'active',
  'paused'
);

-- ─── Tables ─────────────────────────────────────────────────────────────────

CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'vendor')),
  vendor_id   UUID,  -- FK added after vendors table is created
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.festivals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  banner_url    TEXT,
  map_url       TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at     TIMESTAMPTZ,
  ends_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.vendors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_id   UUID NOT NULL REFERENCES public.festivals(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  logo_url      TEXT,
  location_hint TEXT,
  status        vendor_status NOT NULL DEFAULT 'active',
  requires_prep BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX vendors_festival_id_idx ON public.vendors(festival_id);

-- Add FK from profiles to vendors now that vendors table exists
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_vendor_id_fkey
  FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);

CREATE TABLE public.menu_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id     UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url     TEXT,
  is_available  BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured   BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX menu_items_vendor_id_idx ON public.menu_items(vendor_id);

CREATE TABLE public.orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_id         UUID NOT NULL REFERENCES public.festivals(id),
  vendor_id           UUID NOT NULL REFERENCES public.vendors(id),
  customer_id         UUID NOT NULL REFERENCES auth.users(id),
  status              order_status NOT NULL DEFAULT 'confirmed',
  total_amount        NUMERIC(10,2) NOT NULL CHECK (total_amount > 0),
  mp_payment_id       TEXT,
  mp_preference_id    TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX orders_vendor_status_idx ON public.orders(vendor_id, status);
CREATE INDEX orders_customer_idx ON public.orders(customer_id, created_at DESC);

-- FR-016a: one active order per customer per vendor
CREATE UNIQUE INDEX orders_one_active_per_customer_vendor
  ON public.orders(customer_id, vendor_id)
  WHERE status NOT IN ('collected', 'cancelled');

CREATE TABLE public.order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id  UUID NOT NULL REFERENCES public.menu_items(id),
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  unit_price    NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  name_snapshot TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX order_items_order_id_idx ON public.order_items(order_id);

CREATE TABLE public.qr_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  is_used     BOOLEAN NOT NULL DEFAULT FALSE,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX qr_codes_token_idx ON public.qr_codes(token);

CREATE TABLE public.payment_failures (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mp_preference_id    TEXT NOT NULL,
  customer_id         UUID REFERENCES auth.users(id),
  error_message       TEXT,
  retry_count         INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Triggers ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Stored Procedure ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_order_atomic(
  p_festival_id       UUID,
  p_vendor_id         UUID,
  p_customer_id       UUID,
  p_total_amount      NUMERIC,
  p_mp_payment_id     TEXT,
  p_mp_preference_id  TEXT,
  p_items             JSONB,
  p_notes             TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id       UUID;
  v_item           JSONB;
  v_requires_prep  BOOLEAN;
  v_initial_status order_status := 'confirmed';
BEGIN
  SELECT requires_prep INTO v_requires_prep
  FROM public.vendors WHERE id = p_vendor_id;

  IF NOT v_requires_prep THEN
    v_initial_status := 'ready_for_pickup';
  END IF;

  INSERT INTO public.orders (
    festival_id, vendor_id, customer_id, status, total_amount,
    mp_payment_id, mp_preference_id, notes
  ) VALUES (
    p_festival_id, p_vendor_id, p_customer_id, v_initial_status, p_total_amount,
    p_mp_payment_id, p_mp_preference_id, p_notes
  ) RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.order_items (order_id, menu_item_id, quantity, unit_price, name_snapshot)
    VALUES (
      v_order_id,
      (v_item->>'menu_item_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price')::NUMERIC,
      v_item->>'name_snapshot'
    );
  END LOOP;

  INSERT INTO public.qr_codes (order_id) VALUES (v_order_id);

  RETURN v_order_id;
END;
$$;

-- ─── Row-Level Security ─────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.festivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_failures ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (id = auth.uid());

-- festivals (public read)
CREATE POLICY "Anyone can read active festivals"
  ON public.festivals FOR SELECT USING (is_active = TRUE);

-- vendors (public read)
CREATE POLICY "Anyone can read vendors"
  ON public.vendors FOR SELECT USING (TRUE);
CREATE POLICY "Vendors can update their own vendor"
  ON public.vendors FOR UPDATE
  USING (id IN (SELECT vendor_id FROM public.profiles WHERE id = auth.uid() AND role = 'vendor'));

-- menu_items (public read)
CREATE POLICY "Anyone can read menu items"
  ON public.menu_items FOR SELECT USING (TRUE);

-- orders
CREATE POLICY "Customers can view own orders"
  ON public.orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Vendors can view their vendor orders"
  ON public.orders FOR SELECT
  USING (vendor_id IN (SELECT vendor_id FROM public.profiles WHERE id = auth.uid() AND role = 'vendor'));
CREATE POLICY "Vendors can update their vendor orders"
  ON public.orders FOR UPDATE
  USING (vendor_id IN (SELECT vendor_id FROM public.profiles WHERE id = auth.uid() AND role = 'vendor'));

-- order_items
CREATE POLICY "Customers can view own order items"
  ON public.order_items FOR SELECT
  USING (order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid()));

-- qr_codes
CREATE POLICY "Customers can view own QR codes"
  ON public.qr_codes FOR SELECT
  USING (order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid()));

-- payment_failures (customers can view their own)
CREATE POLICY "Customers can view own payment failures"
  ON public.payment_failures FOR SELECT USING (customer_id = auth.uid());
