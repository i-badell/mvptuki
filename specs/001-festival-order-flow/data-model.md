# Data Model: Festival Food & Drink Ordering

**Feature**: 001-festival-order-flow | **Date**: 2026-03-05

## Overview

All data lives in a single Supabase (PostgreSQL) project. Row-Level Security (RLS) enforces
access control at the database layer. Supabase Realtime is enabled on the `orders` table only.

---

## Enums

```sql
CREATE TYPE order_status AS ENUM (
  'confirmed',          -- payment received, order created
  'preparing',          -- vendor has started preparing
  'ready_for_pickup',   -- vendor marked ready / auto-set for no-prep items
  'collected',          -- QR scanned and verified
  'cancelled'           -- cancelled before preparing (refund triggered)
);

CREATE TYPE vendor_status AS ENUM (
  'active',   -- accepting orders
  'paused'    -- not accepting new orders (FR-020)
);
```

---

## Tables

### `profiles`

Extends Supabase Auth `auth.users`. Created automatically on user sign-up via trigger.

```sql
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'vendor')),
  vendor_id   UUID REFERENCES public.vendors(id),  -- NULL for customers
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Notes**:
- `vendor_id` links a vendor user to their vendor record
- `role = 'vendor'` is set manually (or via admin) — no self-promotion

---

### `festivals`

```sql
CREATE TABLE public.festivals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  banner_url    TEXT,                    -- Supabase Storage or external CDN URL
  map_url       TEXT,                    -- venue map image
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at     TIMESTAMPTZ,
  ends_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### `vendors`

```sql
CREATE TABLE public.vendors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_id   UUID NOT NULL REFERENCES public.festivals(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  logo_url      TEXT,
  location_hint TEXT,                    -- e.g. "Zone B, Stand 12"
  status        vendor_status NOT NULL DEFAULT 'active',
  requires_prep BOOLEAN NOT NULL DEFAULT TRUE,  -- FALSE = auto ready_for_pickup
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX vendors_festival_id_idx ON public.vendors(festival_id);
```

---

### `menu_items`

```sql
CREATE TABLE public.menu_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id     UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url     TEXT,
  is_available  BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured   BOOLEAN NOT NULL DEFAULT FALSE,  -- shown in multi-vendor festival view (≤5)
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX menu_items_vendor_id_idx ON public.menu_items(vendor_id);
```

---

### `orders`

```sql
CREATE TABLE public.orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_id         UUID NOT NULL REFERENCES public.festivals(id),
  vendor_id           UUID NOT NULL REFERENCES public.vendors(id),
  customer_id         UUID NOT NULL REFERENCES auth.users(id),
  status              order_status NOT NULL DEFAULT 'confirmed',
  total_amount        NUMERIC(10,2) NOT NULL CHECK (total_amount > 0),
  mp_payment_id       TEXT,              -- MercadoPago payment ID from IPN
  mp_preference_id    TEXT,              -- MercadoPago preference ID
  notes               TEXT,              -- optional customer note
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vendor dashboard query + Realtime filter
CREATE INDEX orders_vendor_status_idx ON public.orders(vendor_id, status);

-- Customer order history
CREATE INDEX orders_customer_idx ON public.orders(customer_id, created_at DESC);

-- Enforce FR-016a: one active order per customer per vendor
CREATE UNIQUE INDEX orders_one_active_per_customer_vendor
  ON public.orders(customer_id, vendor_id)
  WHERE status NOT IN ('collected', 'cancelled');
```

**Notes on `updated_at`**: maintained by a trigger (see Triggers section).

---

### `order_items`

```sql
CREATE TABLE public.order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id  UUID NOT NULL REFERENCES public.menu_items(id),
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  unit_price    NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),  -- snapshot at order time
  name_snapshot TEXT NOT NULL,  -- item name at order time (menu may change)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX order_items_order_id_idx ON public.order_items(order_id);
```

---

### `qr_codes`

```sql
CREATE TABLE public.qr_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  is_used     BOOLEAN NOT NULL DEFAULT FALSE,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast token lookup for QR verification endpoint
CREATE INDEX qr_codes_token_idx ON public.qr_codes(token);
```

**Note**: Single-use enforced atomically in `GET /api/qr/:token` via:
```sql
UPDATE qr_codes SET is_used = TRUE, used_at = NOW()
WHERE token = $1 AND is_used = FALSE
RETURNING order_id;
```
If 0 rows updated → token already used or not found.

---

### `payment_failures`

```sql
CREATE TABLE public.payment_failures (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mp_preference_id    TEXT NOT NULL,
  customer_id         UUID REFERENCES auth.users(id),
  error_message       TEXT,
  retry_count         INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose**: After 3 webhook retry failures, a record is inserted here. Supabase Realtime
notifies the customer's holding screen (listening on `mp_preference_id`) so they know the
payment failed without polling.

---

## Stored Procedure: `create_order_atomic`

Creates order, order_items, and qr_code in a single transaction. Called from
`POST /api/payment/webhook` using the service-role client.

```sql
CREATE OR REPLACE FUNCTION create_order_atomic(
  p_festival_id       UUID,
  p_vendor_id         UUID,
  p_customer_id       UUID,
  p_total_amount      NUMERIC,
  p_mp_payment_id     TEXT,
  p_mp_preference_id  TEXT,
  p_items             JSONB,   -- [{menu_item_id, quantity, unit_price, name_snapshot}]
  p_notes             TEXT DEFAULT NULL
)
RETURNS UUID  -- returns order id
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id  UUID;
  v_item      JSONB;
  v_requires_prep BOOLEAN;
  v_initial_status order_status := 'confirmed';
BEGIN
  -- Check if vendor requires prep; if not, set initial status to ready_for_pickup
  SELECT requires_prep INTO v_requires_prep
  FROM public.vendors WHERE id = p_vendor_id;

  IF NOT v_requires_prep THEN
    v_initial_status := 'ready_for_pickup';
  END IF;

  -- Insert order
  INSERT INTO public.orders (
    festival_id, vendor_id, customer_id, status, total_amount,
    mp_payment_id, mp_preference_id, notes
  ) VALUES (
    p_festival_id, p_vendor_id, p_customer_id, v_initial_status, p_total_amount,
    p_mp_payment_id, p_mp_preference_id, p_notes
  ) RETURNING id INTO v_order_id;

  -- Insert order items
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

  -- Insert QR code
  INSERT INTO public.qr_codes (order_id) VALUES (v_order_id);

  RETURN v_order_id;
END;
$$;
```

---

## Triggers

### Auto-update `orders.updated_at`

```sql
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
```

### Auto-create profile on sign-up

```sql
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
```

---

## Row-Level Security (RLS)

All tables have RLS enabled. Policies below use `auth.uid()` (Supabase JWT subject).

### `profiles`

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());
```

### `festivals`, `vendors`, `menu_items` (public read)

```sql
ALTER TABLE public.festivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active festivals"
  ON public.festivals FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can read vendors"
  ON public.vendors FOR SELECT USING (TRUE);

CREATE POLICY "Anyone can read available menu items"
  ON public.menu_items FOR SELECT USING (TRUE);
```

### `orders`

```sql
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Customers: own orders only
CREATE POLICY "Customers can view own orders"
  ON public.orders FOR SELECT
  USING (customer_id = auth.uid());

-- Vendors: orders for their vendor
CREATE POLICY "Vendors can view their vendor's orders"
  ON public.orders FOR SELECT
  USING (
    vendor_id IN (
      SELECT vendor_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'vendor'
    )
  );

-- Vendors: can update status of their orders
CREATE POLICY "Vendors can update their vendor's orders"
  ON public.orders FOR UPDATE
  USING (
    vendor_id IN (
      SELECT vendor_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'vendor'
    )
  );
```

### `order_items`, `qr_codes`

```sql
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own order items"
  ON public.order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE customer_id = auth.uid()
    )
  );

CREATE POLICY "Customers can view own QR codes"
  ON public.qr_codes FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE customer_id = auth.uid()
    )
  );
```

**Note**: Order creation and QR verification use `SECURITY DEFINER` functions or the
service-role client in Nuxt server routes — they bypass RLS intentionally.

---

## Supabase Realtime

Only the `orders` table is added to the realtime publication. QR codes and payment_failures
use separate channels with appropriate filters.

```sql
-- Enable replication for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_failures;
```

Channel patterns:
- **Customer order status**: `postgres_changes` on `orders` WHERE `id=eq.{orderId}`
- **Vendor queue**: `postgres_changes` on `orders` WHERE `vendor_id=eq.{vendorId}`
- **Payment failure**: `postgres_changes` on `payment_failures` WHERE `mp_preference_id=eq.{prefId}`

---

## Entity Relationship Summary

```
auth.users (Supabase)
    │
    └──< profiles (1:1)
            │
            └── vendor_id ──> vendors
                                │
                                ├──< menu_items
                                │
                                └──< orders
                                        │
                                        ├──< order_items ──> menu_items
                                        │
                                        └──< qr_codes

festivals ──< vendors
```
