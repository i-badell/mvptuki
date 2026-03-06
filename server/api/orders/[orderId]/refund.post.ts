// POST /api/orders/:orderId/refund
// Vendor-only: cancel order and trigger MP refund.
// See: specs/001-festival-order-flow/contracts/api.md

import { supabaseAdmin } from '~~/server/utils/supabaseAdmin'
import { mpRefund } from '~~/server/utils/mercadopago'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)

  // 1. Validate session
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED' })

  // 2. Verify vendor role and get vendor_id
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, vendor_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'vendor' || !profile.vendor_id) {
    throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED' })
  }

  const orderId = getRouterParam(event, 'orderId')!

  // 3. Fetch order and verify ownership
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('id, vendor_id, status, mp_payment_id')
    .eq('id', orderId)
    .single()

  if (orderErr || !order) throw createError({ statusCode: 404, statusMessage: 'ORDER_NOT_FOUND' })
  if (order.vendor_id !== profile.vendor_id) {
    throw createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })
  }

  // 4. Check status is cancellable (FR-028)
  if (!['confirmed', 'preparing'].includes(order.status)) {
    throw createError({ statusCode: 409, statusMessage: 'ORDER_NOT_CANCELLABLE' })
  }

  // 5. Mark order as cancelled (triggers Realtime → customer notified)
  await supabaseAdmin.from('orders').update({ status: 'cancelled' }).eq('id', orderId)

  // 6. Trigger MP refund
  if (!order.mp_payment_id) {
    // No payment ID (e.g. test order) — return success without MP call
    return { orderId, status: 'cancelled', refundId: null }
  }

  try {
    const refund = await mpRefund.create({
      payment_id: Number(order.mp_payment_id),
    })

    return {
      orderId,
      status: 'cancelled',
      refundId: String(refund.id),
    }
  } catch {
    // Order is already cancelled — log and return partial success
    // Manual resolution required for MP refund failures (per plan.md note)
    console.error(`MP refund failed for order ${orderId}`)
    return { orderId, status: 'cancelled', refundId: null }
  }
})
