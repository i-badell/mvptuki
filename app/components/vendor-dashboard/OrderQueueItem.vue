<script setup lang="ts">
import type { Order, OrderStatus } from '~~/shared/types'

const props = defineProps<{ order: Order; vendorId: string }>()
const emit = defineEmits<{ statusChange: [orderId: string, status: OrderStatus] }>()

const toast = useToast()
const supabase = useSupabaseClient()
const cancelConfirmOpen = ref(false)
const updating = ref(false)

// Customer name from profiles — fetched lazily
const customerName = ref<string | null>(null)
onMounted(async () => {
  const { data } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', props.order.customer_id)
    .single()
  customerName.value = data?.full_name ?? 'Customer'
})

// Order items — fetched lazily
const orderItems = ref<Array<{ name_snapshot: string; quantity: number }>>([])
onMounted(async () => {
  const { data } = await supabase
    .from('order_items')
    .select('name_snapshot, quantity')
    .eq('order_id', props.order.id)
  orderItems.value = data ?? []
})

async function advance() {
  updating.value = true
  const next: Record<string, OrderStatus> = {
    confirmed: 'preparing',
    preparing: 'ready_for_pickup',
  }
  const nextStatus = next[props.order.status]
  if (!nextStatus) return

  emit('statusChange', props.order.id, nextStatus)
  updating.value = false
}

async function cancelOrder() {
  updating.value = true
  cancelConfirmOpen.value = false

  try {
    await $fetch(`/api/orders/${props.order.id}/refund`, { method: 'POST' })
    toast.success('Order cancelled and refund initiated.')
  } catch {
    toast.error('Failed to cancel order. Please try again.')
  } finally {
    updating.value = false
  }
}

const advanceLabel: Record<string, string> = {
  confirmed: 'Start Preparing',
  preparing: 'Mark Ready',
}

const canCancel = computed(() => props.order.status === 'confirmed')
const canAdvance = computed(() => ['confirmed', 'preparing'].includes(props.order.status))
</script>

<template>
  <div class="rounded-card border bg-surface p-4 flex flex-col gap-3">
    <!-- Header -->
    <div class="flex items-start justify-between gap-2">
      <div>
        <p class="font-semibold text-text-primary text-sm">{{ customerName }}</p>
        <p class="text-xs text-text-muted">
          #{{ order.id.slice(-8).toUpperCase() }} · ${{ order.total_amount.toFixed(0) }}
        </p>
      </div>
      <OrderStatusBadge :status="order.status" />
    </div>

    <!-- Items -->
    <ul class="text-sm text-text-primary space-y-0.5">
      <li v-for="(item, i) in orderItems" :key="i">
        <span class="font-medium">{{ item.quantity }}×</span> {{ item.name_snapshot }}
      </li>
    </ul>

    <!-- Actions -->
    <div class="flex gap-2">
      <AppButton
        v-if="canAdvance"
        :loading="updating"
        full-width
        @click="advance"
      >
        {{ advanceLabel[order.status] }}
      </AppButton>
      <AppButton
        v-if="canCancel"
        variant="danger"
        :disabled="updating"
        @click="cancelConfirmOpen = true"
      >
        Cancel
      </AppButton>
    </div>

    <!-- Cancel confirm modal -->
    <AppModal
      v-model:open="cancelConfirmOpen"
      title="Cancel this order?"
      description="This will cancel the order and initiate a full refund to the customer."
    >
      <template #footer>
        <AppButton variant="secondary" full-width @click="cancelConfirmOpen = false">Keep order</AppButton>
        <AppButton variant="danger" full-width :loading="updating" @click="cancelOrder">
          Yes, cancel
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>
