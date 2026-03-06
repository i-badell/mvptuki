<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

import type { Order } from '~~/shared/types'

const { fetchOrders } = useOrder()

const orders = ref<Order[]>([])
const pending = ref(true)

onMounted(async () => {
  orders.value = await fetchOrders()
  pending.value = false
})

const activeOrders = computed(() =>
  orders.value.filter((o) => !['collected', 'cancelled'].includes(o.status))
)
const pastOrders = computed(() =>
  orders.value.filter((o) => ['collected', 'cancelled'].includes(o.status))
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-xl font-bold text-text-primary">My Orders</h1>

    <template v-if="pending">
      <div v-for="i in 3" :key="i" class="h-20 rounded-card bg-surface-muted animate-pulse" />
    </template>

    <template v-else>
      <!-- Active orders -->
      <section v-if="activeOrders.length">
        <h2 class="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">Active</h2>
        <div class="flex flex-col gap-2">
          <OrderCard
            v-for="order in activeOrders"
            :key="order.id"
            :order="order"
          />
        </div>
      </section>

      <!-- Past orders -->
      <section v-if="pastOrders.length">
        <h2 class="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">Past orders</h2>
        <div class="flex flex-col gap-2">
          <OrderCard
            v-for="order in pastOrders"
            :key="order.id"
            :order="order"
          />
        </div>
      </section>

      <!-- Empty state -->
      <div v-if="!orders.length" class="text-center py-16">
        <p class="text-4xl mb-4">🛍️</p>
        <p class="text-text-muted text-sm">No orders yet. Browse vendors to get started!</p>
        <NuxtLink to="/festival" class="text-brand-primary text-sm mt-2 block hover:underline">
          Explore festival →
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
