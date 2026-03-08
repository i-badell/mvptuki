<script setup lang="ts">
import type { MenuItem } from '~~/shared/types'

const props = defineProps<{ item: MenuItem; vendorId: string; vendorName: string }>()

const { cart, addItem, updateQuantity, removeItem } = useCart()
const toast = useToast()

const vendorSwitchOpen = ref(false)

const currentQty = computed(
  () => cart.value?.items.find((i) => i.menuItemId === props.item.id)?.quantity ?? 0,
)

function handleAdd() {
  if (!props.item.is_available) return
  const result = addItem(
    props.vendorId,
    props.vendorName,
    { menuItemId: props.item.id, name: props.item.name, unitPrice: props.item.price, imageUrl: props.item.image_url },
    1,
  )
  if (result === 'vendor_mismatch') {
    vendorSwitchOpen.value = true
  } else {
    toast.success(`${props.item.name} agregado`)
  }
}

function handleQtyChange(delta: number) {
  const next = currentQty.value + delta
  if (next <= 0) {
    removeItem(props.item.id)
  } else {
    updateQuantity(props.item.id, next)
  }
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
    class="flex items-center py-[14px] gap-3.5"
    :class="!item.is_available ? 'opacity-50' : ''"
    style="border-bottom: 1px solid #e8e8e8;"
  >
    <!-- Info -->
    <div class="flex-1 min-w-0">
      <!-- Name + badge -->
      <div class="flex items-center gap-1.5 mb-[3px]">
        <p class="font-bold text-black" style="font-size: 14px; line-height: 1.2;">{{ item.name }}</p>
        <span
          v-if="item.is_featured && item.is_available"
          class="font-bold uppercase flex-shrink-0 rounded-[4px] px-1.5"
          style="font-size: 9px; letter-spacing: 0.8px; background: #fef3c7; color: #92400e; padding-top: 2px; padding-bottom: 2px;"
        >
          Popular
        </span>
        <span
          v-if="!item.is_available"
          class="font-bold uppercase flex-shrink-0 rounded-[4px] px-1.5 text-gray-400 bg-gray-100"
          style="font-size: 9px; letter-spacing: 0.8px; padding-top: 2px; padding-bottom: 2px;"
        >
          No disponible
        </span>
      </div>

      <!-- Description -->
      <p
        v-if="item.description"
        class="text-gray-500 mb-1.5 truncate"
        style="font-size: 11px; line-height: 1.5;"
      >
        {{ item.description }}
      </p>

      <!-- Price + qty controls -->
      <div class="flex items-center gap-2.5">
        <span class="font-bold text-black" style="font-size: 15px;">${{ item.price.toFixed(0) }}</span>

        <!-- Qty control (when already in cart) -->
        <div
          v-if="currentQty > 0"
          class="flex items-center overflow-hidden"
          style="border: 1.5px solid #111111; border-radius: 8px;"
        >
          <button
            class="flex items-center justify-center bg-white text-black font-bold transition-colors active:bg-gray-100"
            style="width: 28px; height: 28px; border: none; font-size: 16px;"
            @click="handleQtyChange(-1)"
          >
            −
          </button>
          <span
            class="text-center font-bold text-black"
            style="min-width: 24px; font-size: 13px; border-left: 1px solid #e8e8e8; border-right: 1px solid #e8e8e8; padding: 0 4px; line-height: 28px;"
          >
            {{ currentQty }}
          </span>
          <button
            class="flex items-center justify-center bg-red text-white font-bold transition-colors active:bg-red-dark"
            style="width: 28px; height: 28px; border: none; font-size: 16px;"
            @click="handleQtyChange(1)"
          >
            +
          </button>
        </div>

        <!-- Add button (when not in cart) -->
        <button
          v-else-if="item.is_available"
          class="flex items-center justify-center text-white bg-red transition-transform active:scale-[0.86] flex-shrink-0"
          style="width: 28px; height: 28px; border-radius: 7px; border: 1.5px solid #111111; font-size: 20px; line-height: 1;"
          @click="handleAdd"
        >
          +
        </button>
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
