# Feature Specification: Festival Food & Drink Ordering

**Feature Branch**: `001-festival-order-flow`
**Created**: 2026-03-02
**Updated**: 2026-03-05
**Status**: Draft
**Input**: User description: "An app that allows music/food festival attendees to order food or drinks without waiting in queue. One cart per stand/bar. When an order has food, vendor sets different order status to inform customer. When an order has no prep time, order is set to auto retrieve. Multi-vendor festival shows top 5 items per vendor on main screen; single-vendor festival shows a reduced menu with expand option. Festival page has vendors, a banner and a map. User logs in with email/password. Payment via MercadoPago."

## User Scenarios & Testing *(mandatory)*

<!--
  User stories are prioritized journeys ordered by importance.
  Each story must be independently testable and deliver standalone value.
-->

### User Story 1 - Authenticate & Access Festival (Priority: P1)

A festival-goer opens the app, creates an account or logs in with their email and
password, and lands on the festival page. The festival page displays a banner image,
a map of the event grounds, and the available vendors (or a reduced menu if only one
vendor is present).

**Why this priority**: Authentication gates all purchasing activity. Without it, no
other feature can be used. Establishing the festival page layout is foundational to
every subsequent user journey.

**Independent Test**: A tester registers a new account with an email and password,
logs in, and confirms they see the festival main page with a banner, a venue map, and
at least one vendor displayed.

**Acceptance Scenarios**:

1. **Given** the app is opened, **When** the user provides a valid email and password,
   **Then** they are authenticated and directed to the festival main page.
2. **Given** the festival has multiple vendors, **When** the main page loads,
   **Then** each vendor card shows the vendor name, category, and up to 5 featured
   menu items, with a link to view the full menu.
3. **Given** the festival has exactly one vendor, **When** the main page loads,
   **Then** a condensed version of that vendor's menu is shown inline, with an option
   to expand and view the complete menu.
4. **Given** the user enters incorrect credentials, **When** they attempt to log in,
   **Then** a clear error message is displayed and no access is granted.

---

### User Story 2 - Browse Vendor & Place Order (Priority: P1)

A logged-in festival-goer selects a vendor (or expands the single-vendor menu),
browses the full menu, adds items to their cart, reviews their order, completes
payment via MercadoPago, and receives an order confirmation screen. For instant
orders (no prep time), the order is immediately marked as ready for collection.
For orders requiring preparation, a QR code and estimated wait time are shown.

**Why this priority**: This is the core purchase flow. All other stories depend on an
order existing. It must work end-to-end to deliver the product's primary value
proposition.

**Independent Test**: A tester logs in, selects a vendor, adds at least two items
(including one item with prep time and one without), completes a test payment, and
confirms: the no-prep item is immediately retrievable, and the food item shows a QR
code with estimated wait time.

**Acceptance Scenarios**:

1. **Given** the user selects a vendor, **When** the full menu loads, **Then** all
   items are shown with name, description, price, and availability.
2. **Given** items are in the cart, **When** the user initiates checkout and completes
   MercadoPago payment, **Then** the order is confirmed and a success screen appears.
3. **Given** the confirmed order contains only items with no prep time,
   **When** payment succeeds, **Then** the order status is automatically set to
   "Ready for Pickup" without vendor intervention.
4. **Given** the confirmed order contains at least one food item requiring preparation,
   **When** payment succeeds, **Then** the order status is "Confirmed" and a unique
   QR code with estimated wait time is displayed.
5. **Given** a user tries to add items from a different vendor, **When** their cart
   already has items from another vendor, **Then** the app prompts them to clear
   their current cart before proceeding.

---

### User Story 3 - Vendor Manages Order Lifecycle (Priority: P2)

A vendor operator views incoming orders on their management screen in real time. For
orders requiring preparation, they advance the status through preparation stages to
inform the customer. Instant orders (no prep time) are automatically resolved and do
not require vendor action for status changes.

**Why this priority**: Vendor order management closes the loop for food orders
requiring preparation. Without it, customers have no way to know when to collect,
and the no-queue promise breaks down for prepared food.

**Independent Test**: Using a food order from US2, a vendor operator sees the new
order appear within 10 seconds, advances it to "Preparing", then to "Ready for
Pickup", and confirms each status change is reflected on the customer's screen.

**Acceptance Scenarios**:

1. **Given** a customer places a food order, **When** the vendor views their
   dashboard, **Then** the order appears within 10 seconds with items, quantities,
   and customer name.
2. **Given** an order is in the queue, **When** the vendor advances its status,
   **Then** the customer's order screen reflects the new status in real time.
3. **Given** an order contains no-prep-time items only, **When** payment is confirmed,
   **Then** the order does NOT appear in the vendor's pending queue — it is
   automatically collected.
4. **Given** a vendor needs to pause, **When** they toggle availability to "Closed",
   **Then** their storefront is grayed out on the main page and no new orders can be
   placed, while existing orders remain unaffected.

---

### User Story 4 - QR Code Pickup & Verification (Priority: P3)

When a food order is marked "Ready for Pickup" by the vendor, the customer presents
their QR code at the stand. The vendor scans it, the system validates it, marks the
order as Collected, and confirms the handoff to both parties. The QR code becomes
invalid after use.

**Why this priority**: QR verification is the final step that makes the contactless
pickup experience secure and eliminates confusion at the stand. It is dependent on
a working order flow (P1) and vendor management (P2).

**Independent Test**: Using a "Ready for Pickup" order from US3, a tester displays
the QR code on the customer device and a second tester scans it on the vendor
interface. Both screens confirm "Collected". A second scan attempt is rejected.

**Acceptance Scenarios**:

1. **Given** the order status is "Ready for Pickup", **When** the customer opens
   their order screen, **Then** the QR code is prominently displayed.
2. **Given** the vendor scans a valid QR code, **When** verification succeeds,
   **Then** the order is marked "Collected" on both screens and the QR code is
   invalidated.
3. **Given** a QR code from an already-collected order is scanned, **When** the
   vendor attempts verification, **Then** the system rejects it with a clear error
   message and the order status does not change.
4. **Given** an invalid or unrecognized QR code is scanned, **When** verification
   fails, **Then** the vendor sees a clear error and no order state changes.

---

### Edge Cases

- What happens when a vendor runs out of an item after a customer has added it to
  their cart but before payment completes?
- What happens if the customer's connection drops immediately after payment but before
  the confirmation screen loads — how does the customer retrieve their order?
- What if a customer navigates away from the QR code screen before reaching the
  vendor — can they return to it from their order history?
- What happens to an in-progress food order if the vendor closes their storefront
  mid-festival?
- If a MercadoPago payment is authorized but order creation fails, the system retries
  up to 3 times automatically; on total failure the payment is voided and the customer
  is notified.
- A customer may have multiple simultaneous active orders (one per vendor); all are
  displayed on the order history screen grouped by status.

## Clarifications

### Session 2026-03-05

- Q: Who can cancel an order, under what conditions, and does it trigger a refund? → A: Only vendors can cancel an order, and only before preparation has begun. Cancellation automatically triggers a full MercadoPago refund to the customer.
- Q: Can a customer have multiple simultaneous active orders from different vendors? → A: Yes — a customer can have multiple active orders (one per vendor at a time); all active orders are accessible from an order history/active orders screen.
- Q: What happens when MercadoPago authorizes payment but order creation fails server-side? → A: System retries order creation up to 3 times automatically; if all attempts fail, the payment is voided/refunded and the customer is notified of the failure.
- Q: Is self-serve password reset in scope for this MVP? → A: Yes — a "forgot password" flow sends a reset link to the customer's registered email address.
- Q: How are the 5 featured items per vendor selected on the multi-vendor main page? → A: Admin or vendor manually flags which items appear as featured; no automatic selection.

## Requirements *(mandatory)*

### Functional Requirements

**Authentication**

- **FR-001**: System MUST allow users to create an account using a valid email address
  and a password that meets minimum security requirements.
- **FR-002**: System MUST authenticate users with their email and password before
  granting access to any festival or ordering functionality.
- **FR-003**: System MUST display a clear error message when login credentials are
  incorrect, without revealing which field (email or password) is wrong.
- **FR-003a**: System MUST provide a "forgot password" flow that sends a time-limited
  password reset link to the customer's registered email address.
- **FR-004**: System MUST allow authenticated users to remain logged in across sessions
  without re-entering credentials each time.

**Festival Main Page**

- **FR-005**: The festival main page MUST display a banner image representing the
  event, a map of the event venue, and a list of active vendors.
- **FR-006**: When a festival has more than one vendor, the main page MUST display up
  to 5 manually featured menu items per vendor (flagged by admin or vendor), with a
  visible link to the vendor's full menu on a separate page.
- **FR-007**: When a festival has exactly one vendor, the main page MUST display a
  condensed version of that vendor's menu inline, with an option to expand and view
  the complete menu.
- **FR-008**: Vendors marked as unavailable MUST be visually distinguished on the main
  page and MUST NOT accept new orders while paused.

**Browsing & Cart**

- **FR-009**: Users MUST be able to view a vendor's full menu on a dedicated page,
  with each item showing name, description, price, and real-time availability.
- **FR-010**: Users MUST be able to add, remove, and adjust quantities of items in
  their cart before checkout.
- **FR-011**: A cart MUST be scoped to a single vendor. Attempting to add an item from
  a different vendor MUST prompt the user to clear their existing cart first.

**Checkout & Payment**

- **FR-012**: System MUST display an itemized order summary with a total price before
  the user confirms payment.
- **FR-013**: System MUST process payment through MercadoPago before confirming the
  order; no order is confirmed until payment is successfully authorized.
- **FR-013a**: If payment is authorized but order creation fails, the system MUST
  automatically retry order creation up to 3 times. If all retries fail, the system
  MUST void/refund the authorized payment in full and notify the customer that their
  order could not be placed and no charge will appear.

**Order Confirmation & Auto-Retrieval**

- **FR-014**: When a confirmed order contains only items with no preparation time,
  the system MUST automatically set the order status to "Ready for Pickup" immediately
  upon payment confirmation, without requiring any vendor action.
- **FR-015**: When a confirmed order contains at least one item requiring preparation,
  the system MUST generate a unique, single-use QR code and display it with the order
  number, vendor name, and an estimated wait time.
- **FR-016**: Users MUST be able to return to any of their active orders and QR codes
  at any point from an order history screen, without re-entering any information.
- **FR-016a**: A customer MAY have multiple simultaneous active orders, with at most
  one active order per vendor at any given time. All active orders MUST be displayed
  on the order history screen with their current status.

**Order Status & Notifications**

- **FR-017**: System MUST update the customer's displayed order status in real time as
  it progresses: Confirmed → Preparing → Ready for Pickup → Collected.
- **FR-018**: System MUST notify the customer when their order becomes "Ready for
  Pickup" via an in-app alert and, where permission is granted, a push notification.

**Vendor Order Management**

- **FR-019**: Vendors MUST receive new food orders (orders requiring preparation) in
  real time on their management interface, showing item names, quantities, and the
  customer's name.
- **FR-020**: Vendors MUST be able to advance each food order's status (Confirmed →
  Preparing → Ready for Pickup) from their management interface.
- **FR-021**: Vendors MUST be able to pause new order acceptance and resume it without
  affecting orders already in their queue.

**Order Cancellation**

- **FR-025**: Vendors MUST be able to cancel an order that has not yet moved to the
  "Preparing" status.
- **FR-026**: When a vendor cancels an order, the system MUST automatically initiate
  a full refund through MercadoPago and update the order status to "Cancelled".
- **FR-027**: System MUST notify the customer immediately when their order is cancelled,
  displaying the reason (vendor-cancelled) and confirming that a refund has been
  initiated.
- **FR-028**: Orders in "Preparing", "Ready for Pickup", or "Collected" status MUST
  NOT be cancellable by the vendor through normal interface controls.

**QR Code Pickup & Verification**

- **FR-022**: Vendors MUST be able to scan a customer's QR code using their device
  camera to verify and complete a food order pickup.
- **FR-023**: System MUST mark the order as "Collected" upon successful QR
  verification and confirm this to both the vendor and the customer.
- **FR-024**: System MUST reject verification of any QR code that has already been
  used or is not recognized, with a clear error to the vendor and no change to order
  state.

### Key Entities

- **User (Customer)**: A festival attendee with a registered account. Has email,
  hashed password, and order history.
- **Festival**: An event instance with a name, banner image, venue map, and associated
  vendors.
- **Vendor**: A food truck, bar, or stand at the festival. Has a name, category, cover
  image, menu, operational status (active / paused), and a flag indicating whether
  any of its items require preparation time.
- **Menu Item**: A food or drink offering from a vendor. Has name, description, price,
  availability flag, a preparation-required flag (true = needs vendor action, false =
  auto-retrieve), and a featured flag (true = displayed on multi-vendor main page).
- **Cart**: A transient collection of Menu Items from a single vendor, assembled by
  a customer before checkout. Not an order until payment is confirmed.
- **Order**: A confirmed, paid purchase. Has an order number, items with quantities,
  total amount paid, customer reference, order status, optional QR code, and
  timestamps for each status transition.
- **Order Status**: The lifecycle state of an Order — one of: Confirmed, Preparing,
  Ready for Pickup, Collected, Cancelled. Cancellation is only available to vendors
  before the order reaches "Preparing" status.
- **QR Code**: A unique, single-use token linked to exactly one food Order. Active
  only when the order reaches "Ready for Pickup". Invalidated upon collection.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the full journey — from login to receiving an order
  confirmation — in under 3 minutes on a standard mobile connection.
- **SC-002**: Instant (no-prep) orders are automatically marked "Ready for Pickup"
  within 5 seconds of payment confirmation, with no vendor input required.
- **SC-003**: Customers see their order status update within 10 seconds of the vendor
  changing it on the management interface.
- **SC-004**: QR code verification at pickup completes (success or rejection) within
  5 seconds of the vendor initiating the scan.
- **SC-005**: Zero instances of a collected order's QR code being successfully
  verified a second time — single-use enforcement is 100% reliable.
- **SC-006**: At least 90% of first-time users complete a full order without
  requiring external help.
- **SC-007**: System supports at least 500 concurrent active orders across all vendors
  without degradation in status delivery speed.

## Assumptions

The following assumptions were made to fill gaps in the feature description. If any
are incorrect, the relevant requirements should be revisited before planning.

1. **Email/password accounts required**: All customers must register and log in with
   an email and password. Guest checkout is not supported.
2. **Preparation flag per item**: Whether an item requires prep time is configured
   per menu item by an administrator. An order is auto-retrieved only if ALL items in
   it have no prep time.
3. **Single festival context**: This MVP targets one active festival at a time.
   Multi-event or multi-festival management is out of scope.
4. **Admin-configured vendors and menus**: Vendors and their menus are set up by an
   administrator before the festival opens. Self-service vendor onboarding is out of
   scope for this feature.
5. **Customer shows QR on screen**: The customer displays their phone screen to the
   vendor, who scans it using their device camera through the vendor interface.
6. **Single-vendor cart per transaction**: A customer orders from one vendor per
   transaction. Multi-vendor carts are out of scope for this MVP.
7. **MercadoPago as the sole payment method**: All payments are processed through
   MercadoPago. Cash or other payment methods are out of scope.
8. **Featured items are manually flagged**: The up to 5 featured items displayed per
   vendor on the multi-vendor main page are explicitly flagged by the admin or vendor
   during menu setup. No automatic selection by purchase frequency.
