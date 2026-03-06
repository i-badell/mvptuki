# Tasks: Festival Food & Drink Ordering

**Branch**: `001-festival-order-flow` | **Generated**: 2026-03-06
**Input**: `specs/001-festival-order-flow/` — plan.md, spec.md, data-model.md, contracts/api.md, research.md

**Tests**: Not requested — no test tasks generated. Each phase includes manual independent test criteria.

**Organization**: Tasks are grouped by user story to enable independent delivery and validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: Which user story this task belongs to (US1 / US2 / US3 / US4)
- **No [Story] label**: Setup, Foundational, or Polish phase (cross-cutting)
- Exact file paths are included in all task descriptions

## Path Conventions (Nuxt 4)

- **App code**: `app/` — pages, components, composables, layouts, middleware, assets
- **Shared types**: `shared/types/` — accessible from both `app/` and `server/`
- **Server routes**: `server/api/` | **Server utils**: `server/utils/`
- **Config / root**: `nuxt.config.ts`, `package.json`, `biome.json`, `tsconfig.json`

---

## Phase 1: Setup

**Purpose**: Initialize the Nuxt 4 project with all tooling and base configuration. No user story work until this is complete.

- [X] T001 Open a constitution amendment PR updating Technology Constraints from `Nuxt 3.x` → `Nuxt 4.x` (required per plan.md advisory before coding starts)
- [X] T002 Scaffold Nuxt 4 project at repo root (`npx nuxi@latest init .`) and set `future: { compatibilityVersion: 4 }` in `nuxt.config.ts`
- [X] T003 [P] Install runtime dependencies: `@nuxtjs/supabase@^2`, `@nuxt/image`, `@nuxt/fonts` — add to `nuxt.config.ts` modules array
- [X] T004 [P] Install server-only runtime dependency: `mercadopago` — add to `package.json` (no Nuxt module, only imported in `server/`)
- [X] T005 [P] Install client-side dependencies: `qrcode`, `html5-qrcode` — add to `package.json`
- [X] T006 [P] Install dev dependencies: `@biomejs/biome@^2`, `vitest`, `@nuxt/test-utils` — configure `package.json` scripts (`lint`, `format`, `typecheck`, `test`, `dev`, `build`)
- [X] T007 [P] Create `biome.json` at repo root with Biome 2.x config (lint + format rules; validate `.vue` file support — see research.md §9 risk)
- [X] T008 [P] Configure Tailwind CSS 4: install `@tailwindcss/vite`, create `app/assets/css/main.css` with `@import "tailwindcss"`, wire into `nuxt.config.ts` vite plugins
- [X] T009 Create `.env.example` at repo root documenting all required env vars: `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SECRET_KEY`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `NUXT_PUBLIC_APP_URL`

**Checkpoint**: `npm run dev` starts without errors; Tailwind styles render; `npm run lint` passes on empty project.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T010 Create all Supabase enums, tables, indexes, triggers, stored procedure, and RLS policies using the DDL in `specs/001-festival-order-flow/data-model.md` — apply via Supabase CLI migration (`supabase/migrations/0001_initial_schema.sql`)
- [X] T011 Enable Supabase Realtime for `orders` and `payment_failures` tables: `ALTER PUBLICATION supabase_realtime ADD TABLE public.orders; ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_failures;` — add to a separate migration file (`supabase/migrations/0002_enable_realtime.sql`)
- [X] T012 [P] Create shared TypeScript types in `shared/types/index.ts` — define `OrderStatus`, `VendorStatus` enums and typed interfaces for all DB tables (`Profile`, `Festival`, `Vendor`, `MenuItem`, `Order`, `OrderItem`, `QrCode`, `PaymentFailure`)
- [X] T013 [P] Create Supabase service-role admin client in `server/utils/supabaseAdmin.ts` — typed with `Database` from `~~/shared/types`, uses `SUPABASE_SECRET_KEY`
- [X] T014 [P] Create MercadoPago SDK singleton in `server/utils/mercadopago.ts` — exports `mpPreference`, `mpPayment`, `mpRefund` instances initialized with `MP_ACCESS_TOKEN`
- [X] T015 [P] Create QR token utility in `server/utils/qrToken.ts` — exports `generateQrToken(): string` wrapping `crypto.randomUUID()`
- [X] T016 Configure `@nuxtjs/supabase` in `nuxt.config.ts`: set `redirectOptions` (unauthenticated redirect → `/login`, post-login → `/festival`), cookie options, and module-level types
- [X] T017 Create app entry point `app/app.vue` (root `<NuxtLayout>` + `<NuxtPage>`) and error page `app/error.vue` with friendly error display and back-home link
- [X] T018 Create three layouts: `app/layouts/default.vue` (customer shell with top nav and cart icon), `app/layouts/auth.vue` (logo-only, no nav), `app/layouts/vendor.vue` (vendor dashboard shell with vendor name and nav)
- [X] T019 [P] Create UI primitives — all in `app/components/ui/`:
  - `AppButton.vue` (variant: primary / secondary / danger; loading state; disabled state)
  - `AppInput.vue` (label, error message, type passthrough)
  - `AppModal.vue` (slot-based overlay with close button)
  - `AppToast.vue` (success / error / info variants; auto-dismiss after 4s)

**Checkpoint**: Supabase DDL applied; Realtime enabled; shared types compile; server utils importable; layouts render correctly at `/`; UI primitives display in isolation.

---

## Phase 3: User Story 1 — Authenticate & Access Festival (Priority: P1) 🎯 MVP

**Goal**: A festival-goer can register an account, log in, reset their password via email link, and land on the festival main page showing a banner image, venue map, and the list of active vendors with featured items.

**Covers**: FR-001–004, FR-005–008

**Independent Test**: Register new account (`customer@test.com`) → log in → see festival page with banner image, venue map, and at least one vendor card showing up to 5 featured items and a "View full menu" link. Log in with wrong password → see error message (not field-specific). Use "Forgot password" → receive email → reset password → log in with new password.

### Implementation

- [X] T020 [US1] Create `app/middleware/auth.ts` — if user is not authenticated, redirect to `/login`; skip redirect for `/login`, `/register`, `/forgot-password`, `/reset-password`
- [X] T021 [US1] Create `app/composables/useAuth.ts` — wraps `@nuxtjs/supabase` to expose: `register(email, password, fullName)`, `login(email, password)`, `logout()`, `sendPasswordReset(email)`, `updatePassword(newPassword)` — all return typed result objects with error handling
- [X] T022 [P] [US1] Create `app/components/auth/LoginForm.vue` — email + password inputs using `AppInput`; error display (non-field-specific per FR-003); submit calls `useAuth().login()`; "Forgot password?" link → `/forgot-password` (FR-002, FR-003)
- [X] T023 [P] [US1] Create `app/components/auth/RegisterForm.vue` — full name, email, password inputs; validation (non-empty, valid email format, min 8 chars password); submit calls `useAuth().register()` (FR-001)
- [X] T024 [US1] Create `app/pages/login.vue` — uses `auth` layout, renders `LoginForm`; on success redirect to `/festival`; show `AppToast` on error
- [X] T025 [US1] Create `app/pages/register.vue` — uses `auth` layout, renders `RegisterForm`; on success auto-login and redirect to `/festival`; link to `/login`
- [X] T026 [US1] Create `app/pages/forgot-password.vue` — uses `auth` layout; email input; calls `useAuth().sendPasswordReset()`; shows confirmation message after submit (FR-003a)
- [X] T027 [US1] Create `app/pages/reset-password.vue` — uses `auth` layout; reads reset token from URL hash (Supabase magic link); new password + confirm inputs; calls `useAuth().updatePassword()`; redirect to `/login` on success (FR-003a)
- [X] T028 [US1] Create `app/pages/index.vue` — server-side redirect: if authenticated → `/festival`, else → `/login`
- [X] T029 [US1] Create `app/composables/useFestival.ts` — `useFetch` to query the single active festival (`is_active = TRUE`) plus its vendors (ordered by name); returns `{ festival, vendors, pending, error }`
- [X] T030 [P] [US1] Create `app/components/festival/FestivalBanner.vue` — `<NuxtImg>` rendering `festival.banner_url` with responsive sizes; skeleton loading state (FR-005)
- [X] T031 [P] [US1] Create `app/components/festival/VenueMap.vue` — `<NuxtImg>` rendering `festival.map_url`; tappable to open full-screen overlay (FR-005)
- [X] T032 [P] [US1] Create `app/components/festival/VendorCard.vue` — shows vendor logo, name, location hint, up to 5 featured menu items (name + price chips), "View full menu" link → `/vendor/[vendorId]`; visually grayed out + "Closed" badge when `vendor.status = 'paused'` (FR-006, FR-008)
- [X] T033 [P] [US1] Create `app/components/festival/SingleVendorMenu.vue` — condensed inline menu list for single-vendor festivals; shows all items collapsed by default; "See full menu" button → `/vendor/[vendorId]` (FR-007)
- [X] T034 [US1] Create `app/pages/festival/index.vue` — uses `default` layout; calls `useFestival()`; renders `FestivalBanner`, `VenueMap`; if `vendors.length > 1` → renders list of `VendorCard` components; if `vendors.length === 1` → renders `SingleVendorMenu`; applies `auth` middleware (FR-005–008)

**Checkpoint**: Register → log in → festival page shows banner, map, and vendor list. Single vendor: condensed menu shown inline. Multi-vendor: vendor cards with ≤5 featured items each. Paused vendor: grayed out. Wrong credentials: non-field-specific error. Forgot password flow functional.

---

## Phase 4: User Story 2 — Browse Vendor & Place Order (Priority: P1)

**Goal**: A logged-in user browses a vendor's full menu, adds items to a single-vendor cart, reviews their order, pays via MercadoPago, and receives an order confirmation. No-prep orders are auto-set to "Ready for Pickup"; prep orders show a QR code placeholder and order number.

**Covers**: FR-009–016a, FR-013a (payment retry / refund on failure)

**Independent Test**: Log in → select vendor → see all menu items with price, description, availability → add 2 items → open cart → check quantities → go to checkout → see itemized total → redirect to MercadoPago sandbox → complete test payment → land on order confirmation screen. Try to add item from second vendor → see clear-cart prompt. Open order history → see active order with status badge.

### Implementation

- [X] T035 [US2] Create `app/composables/useMenu.ts` — `useFetch` to query `menu_items` for a given `vendorId` filtered by `is_available`; returns `{ items, vendor, pending, error }`
- [X] T036 [P] [US2] Create `app/components/menu/MenuItemCard.vue` — shows item image (NuxtImg), name, description, price; `QuantityControl` for add/remove; grayed out + "Unavailable" overlay when `is_available = false` (FR-009, FR-010)
- [X] T037 [P] [US2] Create `app/components/menu/QuantityControl.vue` — `−` / `+` buttons with quantity display; emits `update:quantity`; hides `−` at qty=0; prevents going below 0 (FR-010)
- [X] T038 [P] [US2] Create `app/components/menu/MenuItemUnavailable.vue` — unavailability overlay/badge component reused by `MenuItemCard`
- [X] T039 [US2] Create `app/pages/vendor/[vendorId]/index.vue` — uses `default` layout; calls `useMenu(vendorId)`; renders vendor header (logo, name, location) + scrollable list of `MenuItemCard` components; floating cart button showing item count (FR-009)
- [X] T040 [US2] Create `app/composables/useCart.ts` — `localStorage`-backed reactive cart; shape: `{ vendorId, items: CartItem[] }`; exposes: `addItem()`, `removeItem()`, `updateQuantity()`, `clearCart()`, `cartTotal`, `itemCount`; on `addItem` from different vendor → throw `VENDOR_MISMATCH` error (handled by VendorSwitchPrompt) (FR-010, FR-011)
- [X] T041 [P] [US2] Create `app/components/cart/CartItem.vue` — item name, unit price, `QuantityControl`, remove button; calls `useCart()` mutations (FR-010)
- [X] T042 [P] [US2] Create `app/components/cart/CartDrawer.vue` — slide-in panel listing `CartItem` components; total price; "Checkout" button → `/checkout`; empty state; triggered by cart icon in `default` layout (FR-010)
- [X] T043 [US2] Create `app/components/cart/VendorSwitchPrompt.vue` — `AppModal` asking "Clear cart from [current vendor] to add items from [new vendor]?"; confirm clears cart and adds new item; cancel dismisses (FR-011)
- [X] T044 [US2] Create `app/components/checkout/OrderSummary.vue` — itemized list (name, qty, price), subtotal, and grand total; read-only view of cart contents (FR-012)
- [X] T045 [US2] Create `app/components/checkout/PaymentButton.vue` — calls `POST /api/payment/preference` with cart data; on success redirects `window.location.href` to `initPoint`; shows loading state and error `AppToast` on failure (FR-013)
- [X] T046 [US2] Create `app/pages/checkout/index.vue` — uses `default` layout; renders `OrderSummary` + `PaymentButton`; redirects to `/orders` if cart is empty; `auth` middleware applied (FR-012)
- [X] T047 [US2] Implement `server/api/payment/preference.post.ts` — validate session; verify vendor active; verify all items available and belong to vendor; recalculate total server-side; check FR-016a (no active order for this vendor); create MP Checkout Pro preference; return `{ preferenceId, initPoint }` — see contracts/api.md for full request/response shape
- [X] T048 [US2] Implement `server/api/payment/webhook.post.ts` — validate `x-signature` header; fetch payment from MP; if `status = 'approved'` call `create_order_atomic` RPC; implement 3-retry loop on DB failure; on total failure insert into `payment_failures` and return 500; handle idempotency via `mp_payment_id` unique constraint (FR-013, FR-013a)
- [X] T049 [US2] Create `app/composables/useOrder.ts` — `useFetch` helpers: `fetchOrder(orderId)` → single order + items + QR token; `fetchOrders()` → all orders for current user ordered by `created_at DESC`; returns typed `Order` objects from `shared/types/`
- [X] T050 [P] [US2] Create `app/components/order/OrderStatusBadge.vue` — color-coded badge for each `OrderStatus` value (confirmed/preparing/ready_for_pickup/collected/cancelled)
- [X] T051 [P] [US2] Create `app/components/order/OrderCard.vue` — compact order summary card (vendor name, item count, total, status badge, created_at); links to `/orders/[orderId]`; used in order history list
- [X] T052 [US2] Create `app/pages/orders/index.vue` — uses `default` layout; calls `useOrder().fetchOrders()`; groups active orders (not collected/cancelled) at top; renders `OrderCard` per order; empty state; `auth` middleware applied (FR-016, FR-016a)
- [X] T053 [US2] Create `app/pages/orders/[orderId]/index.vue` — uses `default` layout; calls `useOrder().fetchOrder(orderId)`; shows order items, total, vendor name; renders `OrderStatusBadge`; placeholder area for QR code (wired in US4); shows "Payment Failed" state if `payment_failures` record exists for the preference ID; `auth` middleware applied (FR-015, FR-016)

**Checkpoint**: Full purchase flow functional end-to-end with MercadoPago sandbox. Cart persists across navigation. Vendor-switch prompt appears on cross-vendor add. Order history shows all active orders. Payment retry failure notifies customer.

---

## Phase 5: User Story 3 — Vendor Manages Order Lifecycle (Priority: P2)

**Goal**: A vendor operator sees new food orders appear in real time (≤10s), advances each order's status (Confirmed → Preparing → Ready for Pickup), can pause/resume order acceptance, and can cancel pre-prep orders which triggers an automatic MP refund. Customer sees status updates in real time.

**Covers**: FR-017–021, FR-025–028

**Independent Test**: Using a food order from US2, open vendor dashboard (logged in as `vendor@test.com`) — order appears within 10s. Advance to "Preparing" → customer's `/orders/[orderId]` page updates within 10s. Advance to "Ready for Pickup" → customer sees update + in-app "Ready" alert. Toggle vendor to "Closed" → festival page shows vendor grayed out → new order attempt is rejected. Cancel a "Confirmed" order → MP refund triggered → customer sees "Cancelled" status and cancellation notice.

### Implementation

- [X] T054 [US3] Create `app/middleware/vendor-only.ts` — verifies session user has `role = 'vendor'` in their profile; if not, redirect to `/`
- [X] T055 [US3] Create `app/composables/useOrderRealtime.ts` — subscribes to Supabase Realtime `postgres_changes` on `orders` table filtered by `id=eq.{orderId}`; on `UPDATE` event refreshes `useOrder().fetchOrder()`; unsubscribes on component unmount; exposes `{ order, status }` reactive refs (FR-017)
- [X] T056 [US3] Create `app/composables/useVendorOrders.ts` — subscribes to Supabase Realtime `postgres_changes` on `orders` table filtered by `vendor_id=eq.{vendorId}` and `status NOT IN ('collected','cancelled')`; maintains a reactive `orders` list updated on INSERT/UPDATE events; exposes `updateOrderStatus(orderId, newStatus)` which calls Supabase update directly (FR-019, FR-020)
- [X] T057 [US3] Create `app/composables/useNotifications.ts` — listens for `status = 'ready_for_pickup'` on `useOrderRealtime` reactive state; triggers in-app `AppToast` alert ("Your order is ready for pickup!"); optionally requests Web Push permission and sends push via `useScript()` / service worker (FR-018)
- [X] T058 [P] [US3] Create `app/components/order/OrderReadyAlert.vue` — prominent banner/modal shown when order reaches `ready_for_pickup` status; auto-shown by `useNotifications`; includes "Show QR" button scrolling to QR section (FR-018)
- [X] T059 [P] [US3] Create `app/components/vendor-dashboard/OrderQueueItem.vue` — shows customer name, item list (name + qty), total, current status badge, and action buttons: "Start Preparing" (confirmed → preparing), "Mark Ready" (preparing → ready_for_pickup), "Cancel Order" (confirmed only — shows confirmation modal before calling refund API); disabled buttons for non-actionable statuses (FR-020, FR-025, FR-028)
- [X] T060 [P] [US3] Create `app/components/vendor-dashboard/OrderQueue.vue` — reactive list rendering `OrderQueueItem` per active order; empty state ("No pending orders"); orders sorted by `created_at ASC` (oldest first); uses `useVendorOrders()` (FR-019)
- [X] T061 [P] [US3] Create `app/components/vendor-dashboard/PauseToggle.vue` — toggle switch showing current vendor `status` (active / paused); on toggle calls Supabase update on `vendors` table for current vendor; shows confirmation before pausing (FR-021)
- [X] T062 [US3] Create `app/pages/dashboard/index.vue` — uses `vendor` layout; applies `vendor-only` middleware; renders `PauseToggle` + `OrderQueue` driven by `useVendorOrders()`; auto-initializes Realtime subscription on mount (FR-019–021)
- [X] T063 [US3] Implement `server/api/orders/[orderId]/refund.post.ts` — validate vendor session; verify order `vendor_id` matches vendor profile; check order `status IN ('confirmed', 'preparing')`; update order to `cancelled`; call MP Refunds API with `mp_payment_id`; return `{ orderId, status, refundId }` — see contracts/api.md for full spec (FR-025–028)
- [X] T064 [US3] Wire `useOrderRealtime` into `app/pages/orders/[orderId]/index.vue` — subscribe on mount; update displayed `OrderStatusBadge` reactively; trigger `useNotifications` when status becomes `ready_for_pickup`; show `OrderReadyAlert` overlay (FR-017, FR-018)

**Checkpoint**: Vendor dashboard live with Realtime updates. Status transitions work (Confirmed → Preparing → Ready). Customer page updates in real time. Pause/resume grays out vendor card on festival page. Cancel + MP refund flow works for pre-prep orders.

---

## Phase 6: User Story 4 — QR Code Pickup & Verification (Priority: P3)

**Goal**: When a food order is "Ready for Pickup", the customer displays their unique QR code. The vendor scans it using their device camera, the system atomically verifies and marks the order "Collected", and both screens update. A second scan of the same QR is rejected with a clear error.

**Covers**: FR-022–024, SC-004, SC-005

**Independent Test**: Use a "Ready for Pickup" order from US3 — customer opens `/orders/[orderId]` → QR code displayed prominently. Open vendor `/dashboard/scan` on a second device → scan the QR → both screens show "Collected". Scan the same QR again → vendor sees "Already collected" error; customer order status unchanged.

### Implementation

- [X] T065 [US4] Create `app/composables/useQrScanner.ts` — dynamically imports `html5-qrcode` inside `onMounted` (`await import('html5-qrcode')`); exposes `startScanning(elementId, onDecoded)` and `stopScanning()`; handles camera permission errors with descriptive messages (FR-022)
- [X] T066 [US4] Create `app/components/order/OrderQrCode.vue` — wrapped in `<ClientOnly>`; imports `qrcode` and renders QR to `<canvas>` using `QRCode.toCanvas(canvasEl, token)` on mount; shows skeleton while loading; token prop comes from `order.qr_codes[0].token` (FR-015)
- [X] T067 [US4] Wire `OrderQrCode` into `app/pages/orders/[orderId]/index.vue` — render `<ClientOnly><OrderQrCode :token="qrToken" /></ClientOnly>` section visible only when order `status = 'ready_for_pickup'` and a QR token exists (FR-015)
- [X] T068 [US4] Create `app/components/vendor-dashboard/QrScanner.vue` — wrapped in `<ClientOnly>`; uses `useQrScanner()` to open device camera in a `<div>` container; on successful decode calls `GET /api/qr/[token]`; shows success (order collected, customer name, items) or error (already used / not found / not ready) using `AppToast`; "Stop Scanning" button cleans up camera (FR-022, FR-023, FR-024)
- [X] T069 [US4] Create `app/pages/dashboard/scan.vue` — uses `vendor` layout; applies `vendor-only` middleware; renders `<ClientOnly><QrScanner /></ClientOnly>`; instructions text above scanner (FR-022)
- [X] T070 [US4] Implement `server/api/qr/[token].get.ts` — validate vendor session; atomic `UPDATE qr_codes SET is_used=TRUE, used_at=NOW() WHERE token=$1 AND is_used=FALSE RETURNING order_id`; if 0 rows → check if token exists (QR_NOT_FOUND vs QR_ALREADY_USED); fetch order and verify `vendor_id` matches session vendor; verify `status = 'ready_for_pickup'` (ORDER_NOT_READY); update order `status = 'collected'`; return order summary — see contracts/api.md for full spec (FR-023, FR-024, SC-004, SC-005)

**Checkpoint**: QR code visible on customer device when order is "Ready for Pickup". Vendor scan succeeds → both screens show "Collected" within 5s. Second scan rejected with correct error. Invalid token rejected with QR_NOT_FOUND error.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Deployment readiness, tooling validation, and end-to-end smoke test.

- [X] T071 [P] Configure Vercel deployment: add `vercel.json` if needed (Nuxt 4 auto-detects via `@nuxt/vercel` preset); set `NUXT_PRESET=vercel` in build settings; verify environment variables are configured in Vercel dashboard per `quickstart.md §12`
- [X] T072 [P] Validate Biome 2.x `.vue` file linting: run `npm run lint` on the full `app/` directory; if Biome reports errors or skips `.vue` files → install `@nuxt/eslint` and configure as fallback per research.md §9 (constitution principle IV)
- [X] T073 [P] Add PWA web manifest and notification icons to `public/icons/` (192×192 and 512×512 PNG); reference in `nuxt.config.ts` `app.head` for Web Push notification badge support (FR-018 prerequisite)
- [X] T074 Run full end-to-end verification against all 11 scenarios in `specs/001-festival-order-flow/quickstart.md §6` (Run Development Server) using MercadoPago sandbox — record any failures as follow-up issues
- [X] T075 [P] Review all server routes for security: confirm no `SUPABASE_SECRET_KEY` or `MP_ACCESS_TOKEN` values appear in client bundles; verify `x-signature` validation on webhook; confirm RLS policies block cross-user data access

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    └── Phase 2 (Foundational) ← BLOCKS all user stories
            ├── Phase 3 (US1 P1) 🎯 MVP
            ├── Phase 4 (US2 P1) — must follow US1 (login required)
            ├── Phase 5 (US3 P2) — must follow US2 (needs real orders)
            └── Phase 6 (US4 P3) — must follow US3 (needs "ready" orders)
                    └── Phase 7 (Polish)
```

### User Story Dependencies

| Story | Depends On | Reason |
|-------|-----------|--------|
| US1 (Auth + Festival) | Foundational | First story; gates all others |
| US2 (Browse + Pay) | US1 | Requires login (US1) to browse; orders must exist for US3/US4 |
| US3 (Vendor Mgmt) | US2 | Requires real orders to appear on dashboard |
| US4 (QR Pickup) | US3 | Requires orders in "ready_for_pickup" status |

### Within Each Phase

- Tasks marked `[P]` within the same phase can run in parallel
- Non-`[P]` tasks depend on earlier tasks in the same phase (follow task number order)
- Database migration (T010) must complete before any Supabase queries work
- Shared types (T012) must exist before server utilities (T013, T014) compile

### Parallel Opportunities Per Phase

**Phase 1**: T003, T004, T005, T006, T007, T008 can all run in parallel after T002
**Phase 2**: T012–T015 can run in parallel after T010 (DDL) and T011 (Realtime) are applied
**Phase 3**: T022–T033 have multiple `[P]` tasks after composables (T021, T029) are done
**Phase 4**: T036–T038 (menu components) and T050–T051 (order components) can run in parallel
**Phase 5**: T058–T061 (dashboard components) all `[P]` — run in parallel
**Phase 6**: T065 (composable) first; then T066–T070 can run in parallel
**Phase 7**: T071, T072, T073, T075 all `[P]`

---

## Parallel Execution Examples

### Phase 3 (US1) — After T020, T021, T029 complete:

```
Parallel group A (components):
  T022 RegisterForm.vue
  T030 FestivalBanner.vue
  T031 VenueMap.vue
  T032 VendorCard.vue
  T033 SingleVendorMenu.vue

Then sequential:
  T024 pages/login.vue
  T025 pages/register.vue
  T026 pages/forgot-password.vue
  T027 pages/reset-password.vue
  T034 pages/festival/index.vue
```

### Phase 5 (US3) — After T054, T055, T056 complete:

```
Parallel group B (dashboard components):
  T058 OrderReadyAlert.vue
  T059 OrderQueueItem.vue
  T060 OrderQueue.vue
  T061 PauseToggle.vue

Then sequential:
  T062 pages/dashboard/index.vue
  T063 server/api/orders/[orderId]/refund.post.ts
  T064 Wire Realtime into orders/[orderId]/index.vue
```

---

## Implementation Strategy

### MVP Scope (US1 + US2 only)

Complete Phases 1–4 to deliver the core purchase flow. At this checkpoint:
- Customers can register, log in, browse vendors, pay via MercadoPago
- No-prep orders auto-complete; prep orders show order confirmation
- Order history accessible

**Stop and validate** against quickstart.md scenarios 1–5 before proceeding to US3/US4.

### Incremental Delivery

| Delivery | Phases | What's Usable |
|----------|--------|--------------|
| Alpha | 1–3 | Auth + festival browsing (no orders) |
| Beta | 1–4 | Full purchase flow with MercadoPago |
| RC | 1–5 | Vendor dashboard + real-time status |
| v1.0 | 1–7 | QR pickup + all polish |

---

## Notes

- `[P]` tasks touch different files and have no incomplete dependencies — safe to parallelize
- `[Story]` label maps each task to its user story for traceability against spec.md
- Each phase ends with a manual checkpoint — validate before starting the next phase
- No test tasks generated (not requested in spec); manual test criteria provided per phase
- Commit after each logical group of tasks; each commit must pass `npm run lint` (Principle IV)
- Constitution amendment (T001) is not a coding task — open the PR first, implement in parallel

---

## Task Count Summary

| Phase | Tasks | Story |
|-------|-------|-------|
| Phase 1: Setup | T001–T009 | 9 tasks |
| Phase 2: Foundational | T010–T019 | 10 tasks |
| Phase 3: US1 Auth + Festival | T020–T034 | 15 tasks |
| Phase 4: US2 Browse + Pay | T035–T053 | 19 tasks |
| Phase 5: US3 Vendor Mgmt | T054–T064 | 11 tasks |
| Phase 6: US4 QR Pickup | T065–T070 | 6 tasks |
| Phase 7: Polish | T071–T075 | 5 tasks |
| **Total** | | **75 tasks** |

**Parallel opportunities**: 30 tasks marked `[P]` across all phases
**MVP scope**: Phases 1–4 (53 tasks, stories US1 + US2)
