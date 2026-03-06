// MercadoPago SDK singleton — server-only.
// NEVER import this file from app/ code.
import { MercadoPagoConfig, Preference, Payment, Refund } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export const mpPreference = new Preference(client)
export const mpPayment = new Payment(client)
export const mpRefund = new Refund(client)
