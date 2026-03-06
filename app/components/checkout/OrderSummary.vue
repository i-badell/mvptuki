<script setup lang="ts">
import type { Cart } from '~~/shared/types'

defineProps<{ cart: Cart }>()

const total = computed(() =>
  // Injected via props — recompute here for display
  useCart().cartTotal.value
)
</script>

<template>
  <div class="rounded-card border bg-surface p-4">
    <h2 class="font-semibold text-text-primary mb-3">Order summary</h2>
    <p class="text-xs text-text-muted mb-3">From {{ cart.vendorName }}</p>

    <ul class="flex flex-col divide-y divide-gray-100 mb-4">
      <li
        v-for="item in cart.items"
        :key="item.menuItemId"
        class="flex items-center justify-between py-2 gap-2"
      >
        <div class="flex-1 min-w-0">
          <span class="text-sm text-text-primary">{{ item.name }}</span>
          <span class="text-xs text-text-muted ml-1">× {{ item.quantity }}</span>
        </div>
        <span class="text-sm font-medium text-text-primary">
          ${{ (item.unitPrice * item.quantity).toFixed(0) }}
        </span>
      </li>
    </ul>

    <div class="flex items-center justify-between border-t border-gray-200 pt-3">
      <span class="font-semibold text-text-primary">Total</span>
      <span class="text-xl font-bold text-text-primary">${{ useCart().cartTotal.value.toFixed(0) }}</span>
    </div>
  </div>
</template>
