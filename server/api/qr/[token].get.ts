// GET /api/qr/:token
// Vendor-only: verify QR token atomically, mark order as collected.
// See: specs/001-festival-order-flow/contracts/api.md

import { supabaseAdmin } from '~~/server/utils/supabaseAdmin'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)

  // 1. Validate session
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED' })

  // 2. Verify vendor role
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, vendor_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'vendor' || !profile.vendor_id) {
    throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED' })
  }

  const token = getRouterParam(event, 'token')!

  // 3. Atomic single-use update — SC-005: zero double-use guarantee
  const { data: updatedRows, error: updateErr } = await supabaseAdmin
    .from('qr_codes')
    .update({ is_used: true, used_at: new Date().toISOString() })
    .eq('token', token)
    .eq('is_used', false)
    .select('order_id')

  if (updateErr) throw createError({ statusCode: 500, statusMessage: 'INTERNAL_ERROR' })

  if (!updatedRows || updatedRows.length === 0) {
    // Token was not updated — either not found or already used
    const { data: existing } = await supabaseAdmin
      .from('qr_codes')
      .select('id, is_used')
      .eq('token', token)
      .single()

    if (!existing) throw createError({ statusCode: 404, statusMessage: 'QR_NOT_FOUND' })
    throw createError({ statusCode: 409, statusMessage: 'QR_ALREADY_USED' })
  }

  const orderId = updatedRows[0].order_id

  // 4. Fetch order and verify vendor ownership
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, vendor_id, status, customer_id, total_amount')
    .eq('id', orderId)
    .single()

  if (!order) throw createError({ statusCode: 404, statusMessage: 'QR_NOT_FOUND' })
  if (order.vendor_id !== profile.vendor_id) {
    throw createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })
  }

  // 5. Verify order is ready for pickup (FR-024)
  if (order.status !== 'ready_for_pickup') {
    // Undo the QR mark since we can't collect it
    await supabaseAdmin
      .from('qr_codes')
      .update({ is_used: false, used_at: null })
      .eq('token', token)
    throw createError({ statusCode: 409, statusMessage: 'ORDER_NOT_READY' })
  }

  // 6. Mark order as collected
  await supabaseAdmin.from('orders').update({ status: 'collected' }).eq('id', orderId)

  // 7. Fetch customer name and items for response
  const [profileRes, itemsRes] = await Promise.all([
    supabaseAdmin.from('profiles').select('full_name').eq('id', order.customer_id).single(),
    supabaseAdmin
      .from('order_items')
      .select('name_snapshot, quantity')
      .eq('order_id', orderId),
  ])

  return {
    orderId,
    status: 'collected' as const,
    customerName: profileRes.data?.full_name ?? null,
    items: (itemsRes.data ?? []).map((i) => ({ name: i.name_snapshot, quantity: i.quantity })),
    collectedAt: new Date().toISOString(),
  }
})
