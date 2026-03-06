# Phase 0 Research: Festival Food & Drink Ordering

**Feature**: 001-festival-order-flow | **Date**: 2026-03-06 (updated for Nuxt 4)

## Scope

This document records the key integration and architectural decisions made during Phase 0
research for the festival ordering MVP. Each decision includes rationale and rejected
alternatives.

---

## 1. Payment Integration — MercadoPago

### Decision: Checkout Pro (server-side preference + redirect to `init_point`)

**How it works**:
1. Customer submits cart → client calls `POST /api/payment/preference`
2. Server creates a MercadoPago Checkout Pro preference using the MP Node SDK (server-only)
3. Server returns `{ preferenceId, initPoint }` to the client
4. Client redirects to `initPoint` (MercadoPago-hosted checkout page)
5. After payment, MP redirects user to `back_urls.success/failure/pending`
6. MP sends an IPN webhook to `POST /api/payment/webhook`; server creates the order

**Rationale**:
- Zero client-side MP SDK — no bundle weight, cleaner security boundary
- No `<ClientOnly>` wrapper needed for payment UI
- Mobile-redirect is common and expected in LATAM markets
- Simpler server-side implementation for MVP; only the MP Node SDK is needed
- Payment verification happens server-to-server (webhook), preventing client spoofing

**Alternatives rejected**:
- **Bricks (embedded SDK)**: Adds significant client bundle weight (~100KB+); requires `<ClientOnly>` wrapping; more complex tokenization flow; no meaningful UX benefit for MVP
- **Transparent Checkout / Core Payments**: Requires PCI DSS compliance considerations; more complex error handling; not recommended for first-time MP integrations

**Implementation notes**:
- MP SDK initialized once as singleton in `server/utils/mercadopago.ts`
- Access token stored in `MP_ACCESS_TOKEN` env var (server-only, never exposed to client)
- Webhook must validate `x-signature` header using `MP_WEBHOOK_SECRET`
- Use sandbox credentials during development (`TEST-...` tokens)

---

## 2. QR Code Generation

### Decision: `qrcode` npm package (~40KB gzip), canvas rendering, `<ClientOnly>`

**How it works**:
- `qrcode` generates a QR from the pickup token string (UUID)
- Rendered to a `<canvas>` element inside a `<ClientOnly>` wrapper (canvas is browser-only)
- Token is embedded in the QR as a plain UUID string; server validates via `GET /api/qr/:token`

**Rationale**:
- Lightweight (~40KB gzip), zero native dependencies
- Well-maintained; battle-tested for browser canvas rendering
- Simple API: `QRCode.toCanvas(canvasEl, token)` — one line of usage
- No external network dependency (everything local)

**Alternatives rejected**:
- **QR API services** (e.g., api.qrserver.com): Network dependency at pickup time; privacy concern (token sent to third party); adds latency
- **`qrcode-terminal` or heavier QR libs**: Either wrong environment or larger bundle
- **SVG-based generation**: `qrcode` supports SVG too; canvas preferred for crisp rendering on high-DPI mobile screens

---

## 3. QR Code Scanning

### Decision: `html5-qrcode` with dynamic import in `onMounted`

**How it works**:
- `useQrScanner.ts` composable dynamically imports `html5-qrcode` inside `onMounted`:
  ```ts
  const { Html5Qrcode } = await import('html5-qrcode')
  ```
- Camera access is browser-only; dynamic import prevents SSR import errors
- On successful decode, composable calls `GET /api/qr/:token` to verify
- `QrScanner.vue` is wrapped in `<ClientOnly>` as an additional SSR guard

**Rationale**:
- `html5-qrcode` is actively maintained, well-documented, supports both camera and file-upload scanning
- Dynamic import eliminates SSR build errors (library uses `navigator`, `window`, `MediaDevices`)
- No native dependencies; works entirely in-browser

**Alternatives rejected**:
- **`@zxing/browser`**: Larger bundle (~200KB); also requires dynamic import; `html5-qrcode` has better mobile camera UX out of the box
- **Native `BarcodeDetector` API**: Inconsistent browser support (not in Firefox as of 2026); would require a polyfill that negates the simplicity benefit
- **Server-side image decode**: Adds round-trip latency; requires image capture and upload step

---

## 4. Real-time Order Status

### Decision: Supabase Realtime via `@nuxtjs/supabase` channels with `postgres_changes`

**How it works**:
- Customer `useOrderRealtime.ts`: subscribes to `postgres_changes` on `orders` table filtered by `id=eq.{orderId}`
- Vendor `useVendorOrders.ts`: subscribes to `postgres_changes` on `orders` table filtered by `vendor_id=eq.{vendorId}`
- Channel opened on component mount, closed on unmount (no zombie subscriptions)
- `UPDATE` events trigger reactive state refresh; status badge updates automatically

**Rationale**:
- Already in the stack — `@nuxtjs/supabase` wraps the Supabase JS client including Realtime
- No additional service, infrastructure, or cost beyond what Supabase provides
- `postgres_changes` events are low-latency (typically <1s), meeting SC-003 (< 10s)
- Supabase's free/pro tier handles 500 concurrent connections comfortably

**Alternatives rejected**:
- **Polling**: Higher server load; adds 5–30s latency depending on interval; violates SC-003
- **Custom WebSocket server**: Overkill for MVP; adds infrastructure complexity; Vercel serverless not suited for persistent WebSocket connections
- **Server-Sent Events (SSE)**: Viable but requires custom server route; Supabase Realtime achieves the same with less code

**RLS for Realtime**:
- Customers: can only subscribe to orders they own (`customer_id = auth.uid()`)
- Vendors: can only subscribe to orders for their vendor (`vendor_id` matches their profile)
- Both enforced at the database RLS level, not just the application layer

---

## 5. Authentication

### Decision: `@nuxtjs/supabase` with `redirectOptions`; vendor role in `profiles.role`

**How it works**:
- `@nuxtjs/supabase` handles cookie-based session management (SSR-safe)
- Automatic token refresh handled by the module
- Password reset emails sent via Supabase Auth email templates
- Vendor vs. customer differentiation via `profiles.role` column (`'customer' | 'vendor'`)
- `middleware/auth.ts`: redirects unauthenticated users to `/login`
- `middleware/vendor-only.ts`: redirects non-vendor users away from `/dashboard`

**Rationale**:
- Module handles all the session complexity (cookie serialization, SSR hydration, token refresh)
- No custom auth server needed
- `redirectOptions` in `nuxt.config.ts` handles post-login redirects declaratively
- Simple role check on `profiles.role` is sufficient for two-role MVP

**Alternatives rejected**:
- **NextAuth / Auth.js**: Not in the stack; adds complexity and a different session model
- **Custom JWT**: More code, more surface area for bugs; Supabase Auth already provides JWTs
- **Supabase custom claims (JWT role)**: Adds complexity for just two roles; `profiles.role` is simpler and auditable

---

## 6. Cart State Management

### Decision: `useCart.ts` composable with `localStorage` + Vue reactive state

**How it works**:
- Cart state: `{ vendorId, items: { menuItemId, quantity, price, name }[] }`
- Persisted to `localStorage` on every mutation
- Hydrated from `localStorage` on first composable call (client-side only)
- If customer adds items from a different vendor, `VendorSwitchPrompt` modal asks to clear cart
- Cart is cleared on successful order creation (webhook confirmation)

**Rationale**:
- Carts are transient — not stored server-side until payment completes
- `localStorage` survives page navigation within the browsing session
- Simple reactive composable is sufficient; no global store needed for single-concern state
- FR-011 (vendor-switch prompt) is handled entirely in the composable

**Alternatives rejected**:
- **Pinia store**: Acceptable, but adds a dependency and boilerplate for a single, session-scoped concern. No benefit over a composable for MVP.
- **Server-side cart (Supabase)**: Adds complexity, requires auth for cart operations, unnecessary round-trips during browsing
- **`sessionStorage`**: Lost on tab close; `localStorage` is slightly more resilient for mobile users who accidentally close/reopen the browser

---

## 7. Nuxt 4 — Folder Structure & Migration

### Decision: Nuxt 4.x with the new `app/` directory layout

**What changes from Nuxt 3**:

| Location | Nuxt 3 | Nuxt 4 |
|----------|--------|--------|
| App entry | `app.vue` (root) | `app/app.vue` |
| Pages | `pages/` (root) | `app/pages/` |
| Components | `components/` (root) | `app/components/` |
| Composables | `composables/` (root) | `app/composables/` |
| Layouts | `layouts/` (root) | `app/layouts/` |
| Middleware | `middleware/` (root) | `app/middleware/` |
| Assets | `assets/` (root) | `app/assets/` |
| Shared types | `types/` (root) | `shared/` (root) — new |
| Server routes | `server/` (root) | `server/` (root) — unchanged |
| Config | `nuxt.config.ts` (root) | `nuxt.config.ts` (root) — unchanged |
| `~` alias | Project root | `app/` directory (srcDir) |

**Key points**:
- `server/` stays at the root — no changes to API route files
- `shared/` is a new root-level directory for code that must be accessible in both `app/` and `server/` contexts (e.g., TypeScript types, pure utility functions)
- Nuxt 4 enforces separate TypeScript projects per context (client, server, shared), providing compile-time errors when server utilities are accidentally imported in client code
- The `~~` alias always points to the project root (useful for importing `shared/` from server routes: `~~/shared/types`)

**@nuxtjs/supabase v2 breaking changes** (required for Nuxt 4 compatibility):
- `SUPABASE_SERVICE_ROLE_KEY` is **deprecated** → renamed to `SUPABASE_SECRET_KEY`
- `useSupabaseUser()` now returns JWT claims (`auth.getClaims()`) rather than the full User object — use `useSupabaseSession()` if full user data is needed
- No API route changes required; `supabaseAdmin` server utility is unaffected

**Rationale**:
- Nuxt 4's `app/` structure provides a cleaner boundary between application code and server code, reducing the risk of server utilities leaking into client bundles
- The separate TypeScript context per directory catches cross-boundary import errors at compile time (e.g., importing `mercadopago` in a composable)
- `shared/types/` replaces the former root `types/` directory and is accessible from both contexts without duplication

**Migration path**:
- This project starts fresh on Nuxt 4; no `codemod` migration needed
- Set `compatibilityVersion: 4` in `nuxt.config.ts` to opt into all Nuxt 4 behaviors explicitly

---

## 8. Dependency Summary

| Package | Environment | Purpose |
|---------|-------------|---------|
| @nuxtjs/supabase v2.x | Runtime | Auth + DB + Realtime client (Nuxt 4 compatible) |
| @nuxt/image | Runtime | Optimized image handling (NuxtImg) |
| @nuxt/fonts | Runtime | Web font optimization |
| mercadopago | Server-only | MP Checkout Pro preference + refunds |
| qrcode | Client (dynamic) | QR token rendering to canvas |
| html5-qrcode | Client (dynamic import) | Camera-based QR scanning |
| @nuxt/test-utils + vitest | Dev | Unit + integration testing |
| @biomejs/biome | Dev | Linting + formatting (2.x; Vue SFC support to be validated) |

Total runtime dependencies: 6 (excluding Nuxt core + Vue). Meets Simplicity First principle.

---

## 9. Open Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Biome 2.x Vue SFC support incomplete | Medium | Validate on first install; add `@nuxt/eslint` as fallback if Biome can't lint `.vue` files |
| MP webhook delivery delay | Low | 3-retry logic in webhook handler; `payment_failures` table notifies customer if all retries fail |
| `html5-qrcode` camera permission denied | Low | Show clear error state with instructions to grant camera access |
| Supabase Realtime connection drop | Low | Composable includes reconnect logic; fallback manual refresh button on status page |
