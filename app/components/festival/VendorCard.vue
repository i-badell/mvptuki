<script setup lang="ts">
import type { VendorWithFeaturedItems } from '~~/shared/types'

const props = defineProps<{ vendor: VendorWithFeaturedItems }>()

const { addItem } = useCart()
const toast = useToast()

// Alternate header colours when no logo image available
const BG_COLORS = ['#1a1a1a', '#d42b2b', '#1a1a1a', '#d42b2b']
const headerBg = computed(
  () => BG_COLORS[props.vendor.name.charCodeAt(0) % BG_COLORS.length],
)

function handleAddItem(item: VendorWithFeaturedItems['menu_items'][number]) {
  const result = addItem(
    props.vendor.id,
    props.vendor.name,
    { menuItemId: item.id, name: item.name, unitPrice: item.price, imageUrl: item.image_url },
  )
  if (result === 'vendor_mismatch') {
    toast.error('Ya tenés items de otro food truck en tu carrito')
  } else {
    toast.success(`${item.name} agregado al carrito`)
  }
}
</script>

<template>
  <div
    class="flex-shrink-0 w-[265px] bg-white rounded-lg overflow-hidden cursor-pointer transition-all"
    style="border: 1.5px solid #111111; box-shadow: var(--shadow-md);"
    :class="vendor.status === 'paused' ? 'opacity-60' : ''"
    @click.self="() => {}"
  >
    <!-- ── Image / hero area ── -->
    <div class="relative" style="height: 130px;">
      <div
        v-if="!vendor.logo_url"
        class="w-full h-full flex items-center justify-center relative"
        :style="{ background: headerBg }"
      >
        <div
          class="absolute inset-0"
          style="background-image: radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px); background-size: 8px 8px;"
        />
        <span class="relative z-10 text-[54px]">🍽️</span>
      </div>
      <NuxtImg
        v-else
        :src="vendor.logo_url"
        :alt="vendor.name"
        class="w-full h-full object-cover"
      />

      <!-- Status badge -->
      <div
        class="absolute top-2.5 left-2.5 z-10 bg-white rounded-[5px] px-2 flex items-center gap-1 font-bold"
        style="border: 1px solid #e8e8e8; font-size: 10px; padding-top: 3px; padding-bottom: 3px;"
      >
        <span
          v-if="vendor.status === 'active'"
          class="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-success"
        />
        {{ vendor.status === 'paused' ? 'Cerrado' : 'Abierto' }}
      </div>

      <!-- Wait time badge (shown when prep is required) -->
      <div
        v-if="vendor.status === 'active' && vendor.requires_prep"
        class="absolute top-2.5 right-2.5 z-10 bg-red text-white rounded-[5px] px-2 font-bold"
        style="font-size: 10px; padding-top: 3px; padding-bottom: 3px;"
      >
        ~10 min
      </div>
    </div>

    <!-- ── Body ── -->
    <div class="px-[15px] py-[14px]">
      <!-- Name + rating row -->
      <div class="flex items-start justify-between mb-0.5">
        <h3 class="font-serif font-bold leading-snug text-black" style="font-size: 16px;">
          {{ vendor.name }}
        </h3>
        <span v-if="vendor.location_hint" class="text-red font-bold flex-shrink-0 ml-2" style="font-size: 12px;">★</span>
      </div>

      <!-- Category / location sub-label -->
      <p class="text-gray-500 uppercase tracking-[1.2px] mb-[11px]" style="font-size: 10px;">
        {{ vendor.description ?? vendor.location_hint ?? 'Food Truck' }}
      </p>

      <!-- Item rows -->
      <div class="flex flex-col border-t border-gray-200 pt-[11px]" style="gap: 9px;">
        <div
          v-for="item in vendor.menu_items"
          :key="item.id"
          class="flex items-center justify-between"
        >
          <span
            class="text-gray-700"
            :class="!item.is_available ? 'line-through text-gray-400' : ''"
            style="font-size: 12px;"
          >
            {{ item.name }}
          </span>
          <div class="flex items-center" style="gap: 9px;">
            <span class="font-bold text-black" style="font-size: 13px;">${{ item.price.toFixed(0) }}</span>
            <button
              :disabled="!item.is_available || vendor.status === 'paused'"
              class="flex items-center justify-center text-white bg-red transition-transform active:scale-[0.84] disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              style="width: 28px; height: 28px; border-radius: 6px; border: 1.5px solid #111111; font-size: 18px;"
              @click.stop="handleAddItem(item)"
            >
              +
            </button>
          </div>
        </div>
        <p v-if="!vendor.menu_items.length" class="text-gray-400" style="font-size: 12px;">Sin items destacados</p>
      </div>

      <!-- View full menu CTA -->
      <NuxtLink
        :to="vendor.status === 'paused' ? '#' : `/vendor/${vendor.id}`"
        class="block w-full text-center font-bold uppercase tracking-[0.8px] transition-colors hover:bg-black hover:text-white mt-[13px] py-[10px] rounded-md bg-transparent text-black"
        :class="vendor.status === 'paused' ? 'pointer-events-none opacity-50' : ''"
        style="border: 1.5px solid #111111; font-size: 12px;"
        @click.stop
      >
        {{ vendor.status === 'paused' ? 'Actualmente cerrado' : 'Ver menú completo →' }}
      </NuxtLink>
    </div>
  </div>
</template>
