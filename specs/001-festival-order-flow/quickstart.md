# Developer Quickstart: Festival Food & Drink Ordering

**Feature**: 001-festival-order-flow | **Date**: 2026-03-06 (updated for Nuxt 4)

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | https://nodejs.org or `nvm install 20` |
| npm | 10+ | Included with Node 20 |
| Supabase CLI | Latest | `npm install -g supabase` |
| Git | Any | Pre-installed on macOS/Linux |
| MercadoPago developer account | — | https://www.mercadopago.com.ar/developers |

---

## 1. Clone & Install

```bash
git clone <repo-url>
cd mvptuki
npm install
```

---

## 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in all values:

```env
# Supabase
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_KEY=<your-anon-key>
SUPABASE_SECRET_KEY=<your-service-role-key>    # @nuxtjs/supabase v2 (replaces SUPABASE_SERVICE_ROLE_KEY)

# MercadoPago (use sandbox credentials during development)
MP_ACCESS_TOKEN=TEST-<your-test-access-token>
MP_WEBHOOK_SECRET=<your-webhook-secret>

# App
NUXT_PUBLIC_APP_URL=http://localhost:3000
```

**Where to find these values**:
- Supabase: Project Settings → API
- MercadoPago: Developer Dashboard → Credentials → Sandbox

---

## 3. Supabase Setup

### 3a. Create a new Supabase project

1. Go to https://supabase.com/dashboard
2. Create a new project; note the URL and keys

### 3b. Run DDL migrations

The DDL from `specs/001-festival-order-flow/data-model.md` must be applied. Once
migration files exist in `supabase/migrations/`, run:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

Or paste the DDL directly into the Supabase SQL Editor during development.

### 3c. Enable Realtime

In the Supabase Dashboard → Database → Replication, enable replication for:
- `public.orders`
- `public.payment_failures`

Or run via SQL:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_failures;
```

### 3d. Configure Auth email templates

In Supabase Dashboard → Authentication → Email Templates:

- **Confirm signup**: Default template is fine for development
- **Reset password**: Update the redirect URL to `{{ .SiteURL }}/reset-password`

In Authentication → URL Configuration:
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/**`

---

## 4. MercadoPago Sandbox Setup

### Get sandbox credentials

1. Log in to https://www.mercadopago.com.ar/developers
2. Go to Your Applications → Create an application
3. Navigate to Credentials → Sandbox → copy the Access Token
4. Set `MP_ACCESS_TOKEN=TEST-...` in `.env`

### Configure webhook (local development)

Use a tunneling tool to expose your local server to MP webhooks:

```bash
# Option A: ngrok
npx ngrok http 3000

# Option B: Cloudflare Tunnel
npx cloudflared tunnel --url http://localhost:3000
```

In MP Developer Dashboard → Webhooks:
- URL: `https://<your-tunnel-url>/api/payment/webhook`
- Events: `payment`
- Copy the webhook secret to `MP_WEBHOOK_SECRET` in `.env`

### Sandbox test cards

| Card | Number | CVV | Expiry | Result |
|------|--------|-----|--------|--------|
| Visa (approved) | 4509 9535 6623 3704 | 123 | 11/25 | Payment approved |
| Mastercard (approved) | 5031 7557 3453 0604 | 123 | 11/25 | Payment approved |
| Any (declined) | 4000 0000 0000 0002 | 123 | 11/25 | Payment declined |

Use any name and CPF/DNI. See full list at: https://www.mercadopago.com.ar/developers/en/docs/checkout-pro/additional-content/your-integrations/test/cards

---

## 5. Nuxt 4 Project Notes

This project uses **Nuxt 4** with the new `app/` directory layout. Key points:

- All Vue application code lives under `app/` (`pages/`, `components/`, `composables/`, `layouts/`, `middleware/`)
- Shared types (used by both `app/` and `server/`) live under `shared/types/`
- `nuxt.config.ts` must include `compatibilityVersion: 4` to enable all Nuxt 4 behaviors:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  // ...rest of config
})
```

- The `~` alias resolves to `app/` (not project root). Use `~~` to reference project root (e.g., `~~/shared/types`)
- `@nuxtjs/supabase` version **2.x** is required for Nuxt 4 compatibility

---

## 6. Run Development Server

```bash
npm run dev
```

App available at: http://localhost:3000

---

## 7. Seed Test Data

Once the database migrations are applied, seed the following via the Supabase SQL Editor
or a migration file:

```sql
-- Insert a test festival
INSERT INTO public.festivals (id, name, description, banner_url, is_active)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Festival Tuki 2026',
  'El mejor festival de comida y bebida',
  'https://picsum.photos/seed/festival/1200/400',
  TRUE
);

-- Insert a test vendor (requires prep)
INSERT INTO public.vendors (id, festival_id, name, description, location_hint, requires_prep)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Las Empanadas de la Abuela',
  'Empanadas caseras con receta tradicional',
  'Zona A, Stand 1',
  TRUE
);

-- Insert menu items
INSERT INTO public.menu_items (vendor_id, name, price, is_available, is_featured)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Empanada de Carne', 150.00, TRUE, TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Empanada de Humita', 140.00, TRUE, TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Empanada de Queso y Cebolla', 140.00, TRUE, FALSE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Docena de Empanadas', 1600.00, TRUE, TRUE);
```

---

## 8. Test Accounts

Register accounts via http://localhost:3000/register, then set roles via SQL:

### Customer account

Register with any email. No additional setup needed — default `role = 'customer'`.

**Suggested**: `customer@test.com` / `password123`

### Vendor account

1. Register with `vendor@test.com` / `password123`
2. Run in Supabase SQL Editor:

```sql
UPDATE public.profiles
SET role = 'vendor', vendor_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
WHERE email = 'vendor@test.com';
```

The vendor can now access `/dashboard` and `/dashboard/scan`.

---

## 9. Code Quality

### Lint

```bash
npm run lint
```

Runs Biome 2.x. If Biome does not yet support `.vue` files, `@nuxt/eslint` is the fallback
(see research.md §1 risk). Check the output carefully on first run.

### Format

```bash
npm run format
```

### Type check

```bash
npm run typecheck
```

---

## 10. Tests

```bash
npm run test
```

Uses Vitest + `@nuxt/test-utils`. Test files live alongside source files as `*.test.ts`
or in `tests/`.

---

## 11. Build & Preview

```bash
npm run build
npm run preview
```

---

## 12. Deployment (Vercel)

1. Push to your Git remote
2. Connect the repository to Vercel
3. Set all environment variables in Vercel Dashboard → Settings → Environment Variables
4. Update `NUXT_PUBLIC_APP_URL` to your production URL
5. Update MercadoPago webhook URL to your production domain
6. Update Supabase Auth redirect URLs to include your production domain

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| `supabase db push` fails | Make sure you're linked to the correct project: `supabase status` |
| Webhook not receiving events | Check ngrok/tunnel is running; verify URL in MP Dashboard |
| Auth redirect loop | Verify `redirectOptions` in `nuxt.config.ts` and Supabase redirect URLs |
| Realtime not working | Confirm `supabase_realtime` publication includes `orders` table |
| Biome errors on `.vue` files | See research.md §9 risk — add `@nuxt/eslint` as fallback |
| `html5-qrcode` SSR errors | Ensure `QrScanner.vue` is wrapped in `<ClientOnly>` |
| `~` alias resolves wrong path | In Nuxt 4, `~` points to `app/`. Use `~~` for project root (e.g., `~~/shared/types`) |
| `SUPABASE_SERVICE_ROLE_KEY` not found | Renamed to `SUPABASE_SECRET_KEY` in `@nuxtjs/supabase` v2 |
