// Shared TypeScript types — accessible from both app/ and server/
// mirrors the Supabase database schema (data-model.md)

// ─── Enums ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'collected'
  | 'cancelled'

export type VendorStatus = 'active' | 'paused'

export type UserRole = 'customer' | 'vendor'

// ─── Database row types ───────────────────────────────────────────────────────

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  vendor_id: string | null
  created_at: string
}

export interface Festival {
  id: string
  name: string
  description: string | null
  banner_url: string | null
  map_url: string | null
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
}

export interface Vendor {
  id: string
  festival_id: string
  name: string
  description: string | null
  logo_url: string | null
  location_hint: string | null
  status: VendorStatus
  requires_prep: boolean
  keywords: string[]
  category_ids: string[]
  created_at: string
}

export interface MenuItem {
  id: string
  vendor_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  is_featured: boolean
  sort_order: number
  created_at: string
}

export interface Order {
  id: string
  festival_id: string
  vendor_id: string
  customer_id: string
  status: OrderStatus
  total_amount: number
  mp_payment_id: string | null
  mp_preference_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  unit_price: number
  name_snapshot: string
  created_at: string
}

export interface QrCode {
  id: string
  order_id: string
  token: string
  is_used: boolean
  used_at: string | null
  created_at: string
}

export interface PaymentFailure {
  id: string
  mp_preference_id: string
  customer_id: string | null
  error_message: string | null
  retry_count: number
  created_at: string
}

export interface Category {
  id: string
  label: string
  emoji: string
  keywords: string[]
  sort_order: number
}

// ─── Enriched / joined types (used in composables) ───────────────────────────

export interface VendorWithFeaturedItems extends Vendor {
  menu_items: MenuItem[]
}

export interface OrderWithDetails extends Order {
  order_items: Array<OrderItem & { menu_item: Pick<MenuItem, 'name' | 'image_url'> }>
  qr_codes: QrCode[]
  vendor: Pick<Vendor, 'id' | 'name' | 'location_hint' | 'logo_url'>
}

// ─── Cart types (client-only, not persisted to DB) ───────────────────────────

export interface CartItem {
  menuItemId: string
  name: string
  unitPrice: number
  quantity: number
  imageUrl: string | null
}

export interface Cart {
  vendorId: string
  vendorName: string
  items: CartItem[]
}

// ─── API response types ───────────────────────────────────────────────────────

export interface PaymentPreferenceResponse {
  preferenceId: string
  initPoint: string
}

export interface QrVerificationResponse {
  orderId: string
  status: OrderStatus
  customerName: string | null
  items: Array<{ name: string; quantity: number }>
  collectedAt: string
}

export interface RefundResponse {
  orderId: string
  status: OrderStatus
  refundId: string
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}
