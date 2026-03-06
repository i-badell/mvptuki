<script setup lang="ts">
import type { PaymentPreferenceResponse } from '~~/shared/types'

const toast = useToast()
const { cart } = useCart()
const loading = ref(false)

async function pay() {
  if (!cart.value) return

  loading.value = true

  try {
    const body = {
      vendorId: cart.value.vendorId,
      items: cart.value.items.map((i) => ({
        menuItemId: i.menuItemId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        name: i.name,
      })),
    }

    const result = await $fetch<PaymentPreferenceResponse>('/api/payment/preference', {
      method: 'POST',
      body,
    })

    // Redirect to MercadoPago hosted checkout
    window.location.href = result.initPoint
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : 'Could not start payment. Please try again.'
    toast.error(msg)
    loading.value = false
  }
}
</script>

<template>
  <AppButton full-width :loading="loading" @click="pay">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
    Pay with MercadoPago
  </AppButton>
</template>
