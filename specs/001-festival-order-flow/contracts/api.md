# API Contracts: Festival Food & Drink Ordering

**Feature**: 001-festival-order-flow | **Date**: 2026-03-06 (updated for Nuxt 4)

All server routes live under `server/api/` in the Nuxt 3 project. They use Nuxt's
`defineEventHandler` and the service-role Supabase client (bypasses RLS). The MP SDK
is server-only and never exposed to the client.

---

## Conventions

- **Auth header**: Supabase session cookie (managed by `@nuxtjs/supabase`)
- **Content-Type**: `application/json` for all request/response bodies
- **Errors**: All error responses follow `{ error: { code: string, message: string } }`
- **Timestamps**: ISO 8601 strings

---

## Endpoint Reference

### `POST /api/payment/preference`

Creates a MercadoPago Checkout Pro preference. Called when the customer taps "Pay".

**Auth**: Required (customer session cookie)

**Request body**:

```json
{
  "vendorId": "uuid",
  "items": [
    {
      "menuItemId": "uuid",
      "quantity": 2,
      "unitPrice": 150.00,
      "name": "Empanada de Carne"
    }
  ],
  "notes": "Sin cebolla"
}
```

**Server actions**:
1. Validate session; extract `customerId` from JWT
2. Verify vendor exists and `status = 'active'`; if paused → 409
3. Verify all menu items belong to `vendorId` and `is_available = true`
4. Calculate `totalAmount` server-side (do not trust client prices)
5. Check FR-016a: customer has no active order for this vendor → 409 if exists
6. Create MP preference via SDK with `back_urls`, `notification_url`, and metadata
7. Return preference details

**Response `200 OK`**:

```json
{
  "preferenceId": "mp-preference-id",
  "initPoint": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=..."
}
```

**Error codes**:

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `UNAUTHORIZED` | No valid session |
| 404 | `VENDOR_NOT_FOUND` | `vendorId` does not exist |
| 409 | `VENDOR_PAUSED` | Vendor `status = 'paused'` |
| 409 | `ORDER_ALREADY_ACTIVE` | Customer already has an active order for this vendor (FR-016a) |
| 422 | `INVALID_ITEMS` | Menu items not found, unavailable, or don't belong to vendor |
| 500 | `MP_ERROR` | MercadoPago SDK error |

---

### `POST /api/payment/webhook`

IPN (Instant Payment Notification) from MercadoPago. Called by MP servers after payment.

**Auth**: MP webhook signature (`x-signature` header) — validated with `MP_WEBHOOK_SECRET`

**Request body** (from MercadoPago):

```json
{
  "action": "payment.updated",
  "data": { "id": "mp-payment-id" }
}
```

**Server actions**:
1. Validate `x-signature` header — reject with 401 if invalid
2. Fetch payment details from MP API using `data.id`
3. If `status != 'approved'` → return 200 (no-op; MP retries other statuses)
4. Extract `metadata` from preference: `{ customerId, vendorId, festivalId, items, notes }`
5. Call `create_order_atomic` RPC with all parameters
6. On success → return 200
7. On failure → increment retry counter; after 3 failures → insert into `payment_failures`; return 500

**Response `200 OK`**: (empty body — MP only cares about 200 vs non-200)

**Error responses**:
- `401`: Invalid signature → MP will NOT retry
- `500`: Order creation failed → MP will retry (up to 3 times per MP's retry policy)

**Idempotency**: `mp_payment_id` is stored on `orders`. If webhook fires twice for the same
payment, the second insert will fail the unique constraint → return 200 (treat as success).

---

### `POST /api/orders/:orderId/refund`

Cancels an order and triggers a MercadoPago refund. Vendor-only.

**Auth**: Required (vendor session cookie); vendor must own the order's vendor

**URL params**: `orderId` — UUID of the order to cancel

**Request body**: none

**Server actions**:
1. Validate session; verify user `role = 'vendor'` and `vendor_id` matches order's `vendor_id`
2. Fetch order; verify `status IN ('confirmed', 'preparing')` — only cancellable before `ready_for_pickup`
3. Update order `status = 'cancelled'` in Supabase (triggers Realtime → customer notified)
4. Call MP Refunds API with `mp_payment_id` from order
5. Return result

**Response `200 OK`**:

```json
{
  "orderId": "uuid",
  "status": "cancelled",
  "refundId": "mp-refund-id"
}
```

**Error codes**:

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `UNAUTHORIZED` | No valid session or not a vendor |
| 403 | `FORBIDDEN` | Order belongs to a different vendor |
| 404 | `ORDER_NOT_FOUND` | `orderId` does not exist |
| 409 | `ORDER_NOT_CANCELLABLE` | `status` is `ready_for_pickup`, `collected`, or `cancelled` |
| 500 | `MP_REFUND_ERROR` | MercadoPago refund API error (order remains `cancelled` in DB) |

**Note on MP_REFUND_ERROR**: The order is marked `cancelled` before the MP call. If the
refund fails, the order stays cancelled and an alert is logged. Manual resolution is out of
scope for MVP.

---

### `GET /api/qr/:token`

Verifies a QR pickup token and marks the order as collected. Vendor-only.

**Auth**: Required (vendor session cookie); vendor must own the order

**URL params**: `token` — UUID string embedded in the QR code

**Server actions**:
1. Validate session; verify user `role = 'vendor'`
2. Atomically update QR record:
   ```sql
   UPDATE qr_codes SET is_used = TRUE, used_at = NOW()
   WHERE token = $1 AND is_used = FALSE
   RETURNING order_id
   ```
3. If 0 rows updated → token already used or not found
4. Fetch order by `order_id`; verify `vendor_id` matches session vendor
5. Verify `status = 'ready_for_pickup'` (FR-024: must be ready before collection)
6. Update order `status = 'collected'` (triggers Realtime → customer sees "Collected")
7. Return order summary

**Response `200 OK`**:

```json
{
  "orderId": "uuid",
  "status": "collected",
  "customerName": "Ana García",
  "items": [
    { "name": "Empanada de Carne", "quantity": 2 }
  ],
  "collectedAt": "2026-03-05T14:32:00Z"
}
```

**Error codes**:

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `UNAUTHORIZED` | No valid session or not a vendor |
| 404 | `QR_NOT_FOUND` | Token does not exist in `qr_codes` |
| 409 | `QR_ALREADY_USED` | Token exists but `is_used = TRUE` |
| 409 | `ORDER_NOT_READY` | Order `status != 'ready_for_pickup'` |
| 403 | `FORBIDDEN` | Order belongs to a different vendor |

---

## Error Response Shape

All error responses use this structure:

```json
{
  "error": {
    "code": "QR_ALREADY_USED",
    "message": "This QR code has already been scanned and the order collected."
  }
}
```

---

## Server Utilities

### `server/utils/supabaseAdmin.ts`

```ts
// Service-role client — bypasses RLS. NEVER import in app/ code.
import { createClient } from '@supabase/supabase-js'
import type { Database } from '~~/shared/types'

export const supabaseAdmin = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!   // @nuxtjs/supabase v2: was SUPABASE_SERVICE_ROLE_KEY
)
```

### `server/utils/mercadopago.ts`

```ts
// MP SDK singleton — server-only
import { MercadoPagoConfig, Preference, Payment, Refund } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
})

export const mpPreference = new Preference(client)
export const mpPayment = new Payment(client)
export const mpRefund = new Refund(client)
```

### `server/utils/qrToken.ts`

```ts
// Thin wrapper for traceability
export const generateQrToken = (): string => crypto.randomUUID()
```

---

## Environment Variables

| Variable | Where used | Description |
|----------|-----------|-------------|
| `SUPABASE_URL` | Server + Client | Supabase project URL |
| `SUPABASE_KEY` | Client only | Supabase publishable (anon) key |
| `SUPABASE_SECRET_KEY` | Server only | Service role key — never exposed to client (@nuxtjs/supabase v2; replaces `SUPABASE_SERVICE_ROLE_KEY`) |
| `MP_ACCESS_TOKEN` | Server only | MercadoPago access token |
| `MP_WEBHOOK_SECRET` | Server only | Used to validate `x-signature` on webhook |
| `NUXT_PUBLIC_APP_URL` | Server + Client | App base URL (used for MP `back_urls`) |
