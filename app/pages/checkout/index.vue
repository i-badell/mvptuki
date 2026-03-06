<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const { cart } = useCart()

// Redirect if cart is empty
onMounted(() => {
  if (!cart.value?.items.length) navigateTo('/festival')
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-3">
      <button class="text-brand-primary" aria-label="Go back" @click="$router.back()">← Back</button>
      <h1 class="text-xl font-bold text-text-primary">Checkout</h1>
    </div>

    <template v-if="cart">
      <OrderSummary :cart="cart" />

      <p class="text-xs text-text-muted text-center">
        You'll be redirected to MercadoPago to complete your payment securely.
      </p>

      <PaymentButton />
    </template>

    <div v-else class="text-center py-12">
      <p class="text-text-muted text-sm">Your cart is empty.</p>
      <NuxtLink to="/festival" class="text-brand-primary text-sm mt-2 block hover:underline">
        Browse vendors
      </NuxtLink>
    </div>
  </div>
  <AppToast />
</template>
