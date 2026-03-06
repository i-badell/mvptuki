<script setup lang="ts">
import type { Order } from '~~/shared/types'

defineProps<{ order: Order; vendorName?: string }>()

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}
</script>

<template>
  <NuxtLink
    :to="`/orders/${order.id}`"
    class="block rounded-card border bg-surface p-4 hover:border-gray-300 transition-colors"
  >
    <div class="flex items-start justify-between gap-3 mb-2">
      <div>
        <p class="font-semibold text-text-primary text-sm">
          {{ vendorName ?? 'Order' }}
        </p>
        <p class="text-xs text-text-muted">{{ formatDate(order.created_at) }}</p>
      </div>
      <OrderStatusBadge :status="order.status" />
    </div>
    <div class="flex items-center justify-between">
      <span class="text-xs text-text-muted">Order #{{ order.id.slice(-8).toUpperCase() }}</span>
      <span class="font-bold text-text-primary">${{ order.total_amount.toFixed(0) }}</span>
    </div>
  </NuxtLink>
</template>
