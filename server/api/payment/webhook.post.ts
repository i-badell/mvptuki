// POST /api/payment/webhook
// MercadoPago IPN handler — verifies payment, creates order atomically, handles 3-retry.
// See: specs/001-festival-order-flow/contracts/api.md

import { mpPayment } from '~~/server/utils/mercadopago'
import { supabaseAdmin } from '~~/server/utils/supabaseAdmin'
import { createHmac } from 'node:crypto'

const MAX_RETRIES = 3

function validateMpSignature(event: Parameters<typeof defineEventHandler>[0]): boolean {
  const config = useRuntimeConfig()
  const secret = config.mpWebhookSecret
  if (!secret) return false

  const xSignature = getHeader(event, 'x-signature') ?? ''
  const xRequestId = getHeader(event, 'x-request-id') ?? ''
  const queryString = getQuery(event)
  const dataId = queryString['data.id'] ?? ''

  // MP signature format: "ts=<ts>,v1=<hash>"
  const parts = Object.fromEntries(xSignature.split(',').map((p) => p.split('=')))
  const ts = parts['ts']
  const v1 = parts['v1']

  if (!ts || !v1) return false

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')

  return expected === v1
}

export default defineEventHandler(async (event) => {
  // 1. Validate MP signature
  if (!validateMpSignature(event)) {
    throw createError({ statusCode: 401, statusMessage: 'INVALID_SIGNATURE' })
  }

  const body = await readBody<{ action: string; data: { id: string } }>(event)

  // Only process payment events
  if (body.action !== 'payment.updated' && body.action !== 'payment.created') {
    return { ok: true }
  }

  // 2. Fetch payment from MP
  const payment = await mpPayment.get({ id: Number(body.data.id) })

  if (payment.status !== 'approved') {
    // MP retries for other statuses — we simply acknowledge
    return { ok: true }
  }

  const meta = payment.metadata as {
    customer_id: string
    vendor_id: string
    festival_id: string
    items: string
    notes: string | null
  }

  const mpPaymentId = String(payment.id)
  const mpPreferenceId = payment.preference_id ?? ''

  // 3. Idempotency check: if order already exists for this payment, succeed silently
  const { data: existing } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('mp_payment_id', mpPaymentId)
    .maybeSingle()

  if (existing) return { ok: true }

  // 4. Parse items from metadata
  const items: Array<{
    menuItemId: string
    quantity: number
    unitPrice: number
    nameSnapshot: string
  }> = JSON.parse(meta.items)

  const totalAmount = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)

  // 5. Create order atomically with retry
  let lastError: unknown = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { data, error } = await supabaseAdmin.rpc('create_order_atomic', {
        p_festival_id: meta.festival_id,
        p_vendor_id: meta.vendor_id,
        p_customer_id: meta.customer_id,
        p_total_amount: totalAmount,
        p_mp_payment_id: mpPaymentId,
        p_mp_preference_id: mpPreferenceId,
        p_items: items.map((i) => ({
          menu_item_id: i.menuItemId,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          name_snapshot: i.nameSnapshot,
        })),
        p_notes: meta.notes,
      })

      if (error) throw error

      return { ok: true, orderId: data }
    } catch (err: unknown) {
      lastError = err
      // Brief pause before retry (non-blocking in serverless context)
      if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, 200 * attempt))
    }
  }

  // 6. All retries failed — record failure and return 500 for MP to retry
  await supabaseAdmin.from('payment_failures').insert({
    mp_preference_id: mpPreferenceId,
    customer_id: meta.customer_id,
    error_message: lastError instanceof Error ? lastError.message : String(lastError),
    retry_count: MAX_RETRIES,
  })

  throw createError({ statusCode: 500, statusMessage: 'ORDER_CREATION_FAILED' })
})
