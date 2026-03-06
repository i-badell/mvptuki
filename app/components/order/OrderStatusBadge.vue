<script setup lang="ts">
import type { OrderStatus } from '~~/shared/types'

defineProps<{ status: OrderStatus }>()

const config: Record<OrderStatus, { label: string; classes: string }> = {
  confirmed: { label: 'Confirmed', classes: 'bg-blue-100 text-blue-700' },
  preparing: { label: 'Preparing', classes: 'bg-yellow-100 text-yellow-700' },
  ready_for_pickup: { label: 'Ready for Pickup 🎉', classes: 'bg-success/10 text-success' },
  collected: { label: 'Collected ✓', classes: 'bg-gray-100 text-text-muted' },
  cancelled: { label: 'Cancelled', classes: 'bg-error/10 text-error' },
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      config[status].classes,
    ]"
  >
    {{ config[status].label }}
  </span>
</template>
