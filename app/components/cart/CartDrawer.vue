<script setup lang="ts">
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const { cart, itemCount, cartTotal } = useCart()

function close() {
  emit('update:open', false)
}

function goToCheckout() {
  close()
  navigateTo('/checkout')
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-transform duration-300"
      enter-from-class="translate-x-full"
      leave-active-class="transition-transform duration-200"
      leave-to-class="translate-x-full"
    >
      <div v-if="open" class="fixed inset-0 z-50 flex justify-end">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40" @click="close" />

        <!-- Drawer panel -->
        <div class="relative w-full max-w-sm bg-surface flex flex-col h-full shadow-xl z-10">
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <h2 class="text-lg font-semibold text-text-primary">
              Your cart
              <span v-if="itemCount" class="text-sm font-normal text-text-muted ml-1">
                ({{ itemCount }} {{ itemCount === 1 ? 'item' : 'items' }})
              </span>
            </h2>
            <button
              class="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors"
              aria-label="Close cart"
              @click="close"
            >
              ✕
            </button>
          </div>

          <!-- Items -->
          <div class="flex-1 overflow-y-auto px-4">
            <template v-if="cart?.items.length">
              <p class="text-xs text-text-muted pt-3 pb-1">From {{ cart.vendorName }}</p>
              <CartItem v-for="item in cart.items" :key="item.menuItemId" :item="item" />
            </template>
            <div v-else class="flex flex-col items-center justify-center h-full text-center py-12">
              <span class="text-4xl mb-3">🛒</span>
              <p class="text-text-muted text-sm">Your cart is empty</p>
            </div>
          </div>

          <!-- Footer -->
          <div v-if="cart?.items.length" class="px-4 pb-6 pt-4 border-t border-gray-100">
            <div class="flex items-center justify-between mb-4">
              <span class="font-medium text-text-primary">Total</span>
              <span class="text-lg font-bold text-text-primary">${{ cartTotal.toFixed(0) }}</span>
            </div>
            <AppButton full-width @click="goToCheckout">Go to checkout</AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
