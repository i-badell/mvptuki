<script setup lang="ts">
import type { Order, OrderStatus } from '~~/shared/types'

const props = defineProps<{ orders: Order[]; vendorId: string }>()

const { updateOrderStatus } = useVendorOrders(props.vendorId)
const toast = useToast()

async function handleStatusChange(orderId: string, status: OrderStatus) {
  try {
    await updateOrderStatus(orderId, status)
  } catch {
    toast.error('Failed to update order status.')
  }
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <template v-if="orders.length">
      <OrderQueueItem
        v-for="order in orders"
        :key="order.id"
        :order="order"
        :vendor-id="vendorId"
        @status-change="handleStatusChange"
      />
    </template>
    <div v-else class="text-center py-16">
      <p class="text-4xl mb-3">✅</p>
      <p class="text-text-muted text-sm">No pending orders right now.</p>
    </div>
  </div>
</template>
