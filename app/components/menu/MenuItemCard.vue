<script setup lang="ts">
import type { MenuItem } from '~~/shared/types'

const props = defineProps<{ item: MenuItem; vendorId: string; vendorName: string }>()

const { cart, addItem, updateQuantity, removeItem } = useCart()
const toast = useToast()

const vendorSwitchOpen = ref(false)
const pendingAdd = ref(false)

const currentQty = computed(
  () => cart.value?.items.find((i) => i.menuItemId === props.item.id)?.quantity ?? 0
)

function handleAdd() {
  if (!props.item.is_available) return

  const result = addItem(
    props.vendorId,
    props.vendorName,
    {
      menuItemId: props.item.id,
      name: props.item.name,
      unitPrice: props.item.price,
      imageUrl: props.item.image_url,
    },
    1
  )

  if (result === 'vendor_mismatch') {
    vendorSwitchOpen.value = true
  }
}

function handleQtyChange(qty: number) {
  updateQuantity(props.item.id, qty)
}

function onVendorSwitchConfirm() {
  const { clearCart } = useCart()
  clearCart()
  vendorSwitchOpen.value = false
  handleAdd()
}
</script>

<template>
  <div
    :class="[
      'flex gap-3 py-3 border-b border-gray-100 last:border-0',
      !item.is_available ? 'opacity-60' : '',
    ]"
  >
    <!-- Item image -->
    <div class="h-20 w-20 rounded-lg overflow-hidden bg-surface-muted flex-shrink-0">
      <NuxtImg
        v-if="item.image_url"
        :src="item.image_url"
        :alt="item.name"
        class="h-full w-full object-cover"
      />
      <div v-else class="h-full w-full flex items-center justify-center text-2xl">🍽️</div>
    </div>

    <!-- Item details -->
    <div class="flex-1 min-w-0 flex flex-col gap-1">
      <div class="flex items-start justify-between gap-2">
        <div>
          <p class="font-medium text-text-primary text-sm leading-snug">{{ item.name }}</p>
          <p v-if="item.description" class="text-xs text-text-muted line-clamp-2 mt-0.5">
            {{ item.description }}
          </p>
        </div>
        <p class="font-semibold text-text-primary text-sm flex-shrink-0">
          ${{ item.price.toFixed(0) }}
        </p>
      </div>

      <!-- Unavailable badge -->
      <span v-if="!item.is_available" class="text-xs text-text-muted">Currently unavailable</span>

      <!-- Quantity control / Add button -->
      <div v-else class="flex justify-end mt-1">
        <QuantityControl
          v-if="currentQty > 0"
          :quantity="currentQty"
          @update:quantity="handleQtyChange"
        />
        <AppButton v-else variant="primary" @click="handleAdd">Add</AppButton>
      </div>
    </div>

    <!-- Vendor switch prompt -->
    <VendorSwitchPrompt
      v-model:open="vendorSwitchOpen"
      :current-vendor-name="cart?.vendorName ?? ''"
      :new-vendor-name="vendorName"
      @confirm="onVendorSwitchConfirm"
    />
  </div>
</template>
