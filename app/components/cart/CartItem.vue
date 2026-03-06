<script setup lang="ts">
import type { CartItem } from '~~/shared/types'

defineProps<{ item: CartItem }>()

const { updateQuantity, removeItem } = useCart()
</script>

<template>
  <div class="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-text-primary truncate">{{ item.name }}</p>
      <p class="text-xs text-text-muted">${{ item.unitPrice.toFixed(0) }} each</p>
    </div>

    <QuantityControl
      :quantity="item.quantity"
      :min="0"
      @update:quantity="
        (qty) => (qty === 0 ? removeItem(item.menuItemId) : updateQuantity(item.menuItemId, qty))
      "
    />

    <p class="w-16 text-right text-sm font-semibold text-text-primary">
      ${{ (item.unitPrice * item.quantity).toFixed(0) }}
    </p>
  </div>
</template>
