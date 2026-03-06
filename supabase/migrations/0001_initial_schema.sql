-- Migration: Tables, indexes, and RLS for Festival Food & Drink Ordering
-- PL/pgSQL functions are in separate files (0003–0005) to avoid
-- Supabase CLI pgx parser issues with semicolons inside $$ blocks.

-- ─── Enums ───────────────────────────────────────────────────────────────────

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

-- ─── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'vendor')),
  vendor_id   UUID,
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

-- Add FK from profiles to vendors after vendors table exists
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

CREATE TABLE public.order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id  UUID NOT NULL REFERENCES public.menu_items(id),
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  unit_price    NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  name_snapshot TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.qr_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  is_used     BOOLEAN NOT NULL DEFAULT FALSE,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.payment_failures (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mp_preference_id    TEXT NOT NULL,
  customer_id         UUID REFERENCES auth.users(id),
  error_message       TEXT,
  retry_count         INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX vendors_festival_id_idx ON public.vendors(festival_id);
CREATE INDEX menu_items_vendor_id_idx ON public.menu_items(vendor_id);
CREATE INDEX orders_vendor_status_idx ON public.orders(vendor_id, status);
CREATE INDEX orders_customer_idx ON public.orders(customer_id, created_at DESC);
CREATE INDEX order_items_order_id_idx ON public.order_items(order_id);
CREATE INDEX qr_codes_token_idx ON public.qr_codes(token);

-- FR-016a: one active order per customer per vendor at a time
CREATE UNIQUE INDEX orders_one_active_per_customer_vendor
  ON public.orders(customer_id, vendor_id)
  WHERE status NOT IN ('collected', 'cancelled');

-- ─── Row-Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.festivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Anyone can read active festivals"
  ON public.festivals FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can read vendors"
  ON public.vendors FOR SELECT USING (TRUE);

CREATE POLICY "Vendors can update their own vendor"
  ON public.vendors FOR UPDATE
  USING (id IN (SELECT vendor_id FROM public.profiles WHERE id = auth.uid() AND role = 'vendor'));

CREATE POLICY "Anyone can read menu items"
  ON public.menu_items FOR SELECT USING (TRUE);

CREATE POLICY "Customers can view own orders"
  ON public.orders FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Vendors can view their vendor orders"
  ON public.orders FOR SELECT
  USING (vendor_id IN (SELECT vendor_id FROM public.profiles WHERE id = auth.uid() AND role = 'vendor'));

CREATE POLICY "Vendors can update their vendor orders"
  ON public.orders FOR UPDATE
  USING (vendor_id IN (SELECT vendor_id FROM public.profiles WHERE id = auth.uid() AND role = 'vendor'));

CREATE POLICY "Customers can view own order items"
  ON public.order_items FOR SELECT
  USING (order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid()));

CREATE POLICY "Customers can view own QR codes"
  ON public.qr_codes FOR SELECT
  USING (order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid()));

CREATE POLICY "Customers can view own payment failures"
  ON public.payment_failures FOR SELECT USING (customer_id = auth.uid());
