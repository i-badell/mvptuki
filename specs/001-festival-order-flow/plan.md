# Implementation Plan: Festival Food & Drink Ordering

**Branch**: `001-festival-order-flow` | **Date**: 2026-03-06 | **Spec**: [spec.md](spec.md)

## Summary

A mobile-first Nuxt 4 + Vue 3 web application for festival attendees to browse vendor
menus, pay through MercadoPago, and receive orders without queuing. Covers 28 FRs across
authentication, ordering, real-time status, QR pickup, and vendor dashboard. All decisions
comply with the Tuki Constitution v2.0.0 (Vue/TS strict/Tailwind 4/Biome 2/Vercel) with
the **Nuxt version upgraded to 4.x** — a constitution amendment is recommended to update
the Technology Constraints table from `Nuxt 3.x` to `Nuxt 4.x`.

## Technical Context

**Language/Version**: TypeScript 5.x (strict)
**Framework**: Nuxt 4.x + Vue 3.x (SSR default; `<ClientOnly>` only for canvas/camera)
**Primary Dependencies**: @nuxtjs/supabase v2.x, @nuxt/image, @nuxt/fonts, mercadopago (server-only), qrcode, html5-qrcode
**Storage**: Supabase (PostgreSQL) — auth, database, Realtime
**Testing**: Vitest + @nuxt/test-utils (configured in Phase 1 foundation)
**Target Platform**: Mobile-first web app, Vercel deployment
**Performance Goals**: Full order journey < 3 min; status updates < 10s; QR verify < 5s (SC-001–SC-004)
**Constraints**: Core Web Vitals LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms
**Scale/Scope**: 500 concurrent active orders, ~4 user-facing page groups, 8 implementation phases

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity First | PASS | 8 runtime deps; no speculative abstractions |
| II. Type Safety | PASS | All SFCs use `<script setup lang="ts">`; no `any`; Nuxt 4 enforces separate TS projects per context (client/server/shared) |
| III. Component Architecture | PASS | SSR default; `<ClientOnly>` only for canvas (QR) and camera (scanner) |
| IV. Code Quality Gates | CONDITIONAL | Biome 2.x Vue SFC support must be validated after install; add `@nuxt/eslint` if inadequate |
| V. Performance by Default | PASS | `@nuxt/image` (`<NuxtImg>`), `@nuxt/fonts`, `useScript()` configured |
| Technology Constraints (Nuxt) | ADVISORY | Constitution locks "Nuxt 3.x"; this plan targets **Nuxt 4.x**. A MINOR constitution amendment is recommended to update the constraint before implementation begins. |

**No blocking gate failures.** The Nuxt version advisory should be resolved via a constitution amendment PR before Phase 1 coding starts.

## Project Structure

### Documentation (this feature)

```text
specs/001-festival-order-flow/
├── spec.md
├── plan.md              ← this file
├── research.md          ← Phase 0
├── data-model.md        ← Phase 1
├── quickstart.md        ← Phase 1
├── contracts/
│   └── api.md           ← Phase 1
└── tasks.md             ← /speckit.tasks (not created here)
```

### Source Code — Nuxt 4 Structure

In Nuxt 4, all application-level code moves into the `app/` directory. Server code, public
assets, and configuration stay at the repository root. The `~` alias points to `app/`
(i.e., `~/components` → `app/components/`).

```text
/                              ← repository root
├── nuxt.config.ts
├── package.json
├── biome.json
├── tsconfig.json
├── .env.example
│
├── app/                       ← ALL client/app-level code lives here (Nuxt 4)
│   ├── app.vue
│   ├── error.vue
│   ├── app.config.ts
│   │
│   ├── layouts/
│   │   ├── default.vue        ← customer shell
│   │   ├── auth.vue           ← login/register (no nav)
│   │   └── vendor.vue         ← vendor dashboard shell
│   │
│   ├── middleware/
│   │   ├── auth.ts            ← redirect unauthenticated → /login
│   │   └── vendor-only.ts     ← redirect non-vendor → /
│   │
│   ├── pages/
│   │   ├── index.vue          ← redirect to /festival or /login
│   │   ├── login.vue
│   │   ├── register.vue
│   │   ├── forgot-password.vue
│   │   ├── reset-password.vue
│   │   ├── festival/
│   │   │   └── index.vue
│   │   ├── vendor/
│   │   │   └── [vendorId]/
│   │   │       └── index.vue
│   │   ├── checkout/
│   │   │   └── index.vue
│   │   ├── orders/
│   │   │   ├── index.vue
│   │   │   └── [orderId]/
│   │   │       └── index.vue
│   │   └── dashboard/
│   │       ├── index.vue      ← vendor order queue
│   │       └── scan.vue       ← QR scanner
│   │
│   ├── components/
│   │   ├── auth/              ← LoginForm, RegisterForm
│   │   ├── festival/          ← FestivalBanner (NuxtImg), VenueMap, VendorCard, SingleVendorMenu
│   │   ├── menu/              ← MenuItemCard, QuantityControl, MenuItemUnavailable
│   │   ├── cart/              ← CartDrawer, CartItem, VendorSwitchPrompt
│   │   ├── checkout/          ← OrderSummary, PaymentButton
│   │   ├── order/             ← OrderStatusBadge, OrderQrCode (ClientOnly), OrderReadyAlert, OrderCard
│   │   ├── vendor-dashboard/  ← OrderQueue, OrderQueueItem, PauseToggle, QrScanner (ClientOnly)
│   │   └── ui/                ← AppButton, AppInput, AppModal, AppToast
│   │
│   ├── composables/
│   │   ├── useAuth.ts
│   │   ├── useCart.ts         ← localStorage-backed reactive cart
│   │   ├── useFestival.ts
│   │   ├── useMenu.ts
│   │   ├── useOrder.ts
│   │   ├── useOrderRealtime.ts    ← Supabase Realtime (customer)
│   │   ├── useVendorOrders.ts     ← Supabase Realtime (vendor)
│   │   ├── useNotifications.ts   ← Web Push + in-app alerts
│   │   └── useQrScanner.ts       ← dynamic import of html5-qrcode
│   │
│   └── assets/
│       └── css/
│           └── main.css       ← Tailwind 4 entry point
│
├── shared/                    ← NEW in Nuxt 4: code shared between app/ and server/
│   └── types/
│       └── index.ts           ← TS types mirroring DB enums/tables (accessible in both contexts)
│
├── server/
│   ├── api/
│   │   ├── payment/
│   │   │   ├── preference.post.ts
│   │   │   └── webhook.post.ts
│   │   ├── orders/
│   │   │   └── [orderId]/
│   │   │       └── refund.post.ts
│   │   └── qr/
│   │       └── [token].get.ts
│   └── utils/
│       ├── supabaseAdmin.ts   ← service-role client (server-only)
│       ├── mercadopago.ts     ← MP SDK singleton (server-only)
│       └── qrToken.ts         ← crypto.randomUUID() wrapper
│
└── public/
    └── icons/                 ← PWA icons for push notification
```

**Structure Decision**: Single Nuxt 4 project at the repository root using the new `app/`
directory layout. The `shared/types/` directory replaces the former `types/` root-level
directory, making types available to both the app and server contexts without duplication.
Server code stays at root-level `server/` — unchanged from Nuxt 3.

**`~` alias**: Points to `app/` in Nuxt 4. All imports within `app/` use `~/components`,
`~/composables`, etc. Server routes use `#imports` and `~~/shared/types` for shared types
(Nuxt 4 provides `~~` alias for the project root).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| PL/pgSQL RPC `create_order_atomic` | Order + items + QR must be created atomically. Partial writes create orphaned records. | Multiple sequential Supabase calls from webhook require manual rollback, error-prone under concurrency. |
| Webhook-driven order creation | MercadoPago authorizes payment asynchronously; order must not exist until payment confirmed. | Client-driven creation after redirect fails if network drops between redirect and client action. |
| Atomic QR UPDATE (`WHERE is_used = FALSE`) | SC-005: 100% single-use guarantee. Two concurrent scans need a DB-level race guard. | Read-then-write pattern has a TOCTOU window — any delay between check and update allows double-use. |
| `payment_failures` table + Realtime | Customer on success holding screen must be notified of 3-retry failure without polling. | Client polling requires indefinite page persistence and adds unnecessary server load. |

## Implementation Sequence (8 phases)

| Phase | Name | Key FRs |
|-------|------|---------|
| 1 | Foundation | Nuxt 4 init, all deps, Biome, Tailwind 4, Supabase DDL, `app/` structure, layouts, UI primitives |
| 2 | Auth | FR-001–004: Register, login, forgot/reset password, route middleware |
| 3 | Festival Page | FR-005–008: Banner, map, multi/single-vendor display |
| 4 | Browsing & Cart | FR-009–011: Full menu page, cart composable, vendor-switch prompt |
| 5 | Checkout & Payment | FR-012–013a: MP preference, webhook, 3-retry, success/failure screens |
| 6 | Order Confirmation & Status | FR-014–018: QR display, order history, Realtime, push notification |
| 7 | Vendor Dashboard | FR-019–021, FR-025–028: Order queue, status advancement, pause/resume, cancellation+refund |
| 8 | QR Pickup | FR-022–024: Scanner, verification endpoint, atomic single-use enforcement |

## Verification (end-to-end test scenarios)

1. Register customer → log in → see festival page with banner, map, vendors
2. Multi-vendor: see ≤5 featured items per vendor; click through to full menu
3. Add items from one vendor → try adding from another → see clear-cart prompt
4. Checkout → redirect to MercadoPago sandbox → complete test payment
5. No-prep order: auto-shows "Ready for Pickup" without vendor action (<5s)
6. Prep order: QR code displayed; vendor dashboard shows order within 10s
7. Vendor advances status → customer sees update in real time (<10s)
8. Vendor scans QR → order marked Collected on both screens
9. Second scan of same QR → rejected with "already collected" error
10. Vendor cancels order (before Preparing) → MP refund triggered → customer notified
11. Forgot password → receive email link → reset → log in with new password
