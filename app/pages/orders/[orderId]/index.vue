<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

import type { OrderWithDetails } from '~~/shared/types'

const route = useRoute()
const orderId = route.params.orderId as string

const { fetchOrder } = useOrder()
const order = ref<OrderWithDetails | null>(null)
const pending = ref(true)

// Wire Realtime (T064 — US3)
const { subscribeToOrder } = useOrderRealtime(orderId, (updated) => {
  if (order.value) {
    order.value = { ...order.value, ...updated }
  }
})

// Notifications for ready_for_pickup (T064 — US3)
const { checkAndNotify } = useNotifications()

onMounted(async () => {
  order.value = await fetchOrder(orderId)
  pending.value = false
  subscribeToOrder()
})

watch(
  () => order.value?.status,
  (status) => {
    if (status === 'ready_for_pickup') {
      checkAndNotify()
    }
  }
)

const qrToken = computed(() => order.value?.qr_codes?.[0]?.token ?? null)
const showQr = computed(
  () => order.value?.status === 'ready_for_pickup' && !!qrToken.value
)

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
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-3">
      <button class="text-brand-primary" @click="$router.back()">← Back</button>
      <h1 class="text-xl font-bold text-text-primary">Order details</h1>
    </div>

    <template v-if="pending">
      <div v-for="i in 3" :key="i" class="h-20 rounded-card bg-surface-muted animate-pulse" />
    </template>

    <template v-else-if="order">
      <!-- Status -->
      <div class="rounded-card border bg-surface p-4 flex items-center justify-between">
        <div>
          <p class="text-sm text-text-muted">Status</p>
          <OrderStatusBadge :status="order.status" class="mt-1" />
        </div>
        <div class="text-right">
          <p class="text-xs text-text-muted">{{ formatDate(order.created_at) }}</p>
          <p class="text-sm font-bold text-text-primary mt-0.5">
            ${{ order.total_amount.toFixed(0) }}
          </p>
        </div>
      </div>

      <!-- Ready alert -->
      <OrderReadyAlert v-if="order.status === 'ready_for_pickup'" />

      <!-- QR Code (FR-015) — wired in T067 (US4) -->
      <ClientOnly v-if="showQr">
        <OrderQrCode :token="qrToken!" />
      </ClientOnly>

      <!-- Vendor info -->
      <div class="rounded-card border bg-surface p-4">
        <p class="text-xs text-text-muted mb-1">Vendor</p>
        <p class="font-semibold text-text-primary">{{ order.vendor.name }}</p>
        <p v-if="order.vendor.location_hint" class="text-xs text-text-muted mt-0.5">
          📍 {{ order.vendor.location_hint }}
        </p>
      </div>

      <!-- Order items -->
      <div class="rounded-card border bg-surface p-4">
        <p class="text-xs text-text-muted mb-3">Items</p>
        <ul class="flex flex-col divide-y divide-gray-100">
          <li
            v-for="item in order.order_items"
            :key="item.id"
            class="flex items-center justify-between py-2 gap-2"
          >
            <span class="text-sm text-text-primary">
              {{ item.name_snapshot }}
              <span class="text-text-muted">× {{ item.quantity }}</span>
            </span>
            <span class="text-sm font-medium text-text-primary">
              ${{ (item.unit_price * item.quantity).toFixed(0) }}
            </span>
          </li>
        </ul>
      </div>
    </template>

    <div v-else class="text-center py-12">
      <p class="text-text-muted text-sm">Order not found.</p>
    </div>
  </div>
</template>
