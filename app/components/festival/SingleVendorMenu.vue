<script setup lang="ts">
import type { VendorWithFeaturedItems } from '~~/shared/types'

const props = defineProps<{ vendor: VendorWithFeaturedItems }>()

const expanded = ref(false)

// Show first 4 items condensed; rest hidden until expanded
const CONDENSED_LIMIT = 4
const visibleItems = computed(() =>
  expanded.value ? props.vendor.menu_items : props.vendor.menu_items.slice(0, CONDENSED_LIMIT)
)
const hasMore = computed(() => props.vendor.menu_items.length > CONDENSED_LIMIT)
</script>

<template>
  <div class="rounded-card border bg-surface p-4 flex flex-col gap-3">
    <!-- Vendor header -->
    <div class="flex items-center gap-3">
      <div class="h-12 w-12 rounded-full overflow-hidden bg-surface-muted flex-shrink-0">
        <NuxtImg
          v-if="vendor.logo_url"
          :src="vendor.logo_url"
          :alt="vendor.name"
          class="h-full w-full object-cover"
        />
        <div v-else class="h-full w-full flex items-center justify-center text-xl">🍽️</div>
      </div>
      <div>
        <h3 class="font-semibold text-text-primary">{{ vendor.name }}</h3>
        <p v-if="vendor.location_hint" class="text-xs text-text-muted">
          📍 {{ vendor.location_hint }}
        </p>
      </div>
    </div>

    <!-- Condensed item list -->
    <ul class="flex flex-col divide-y divide-gray-100">
      <li
        v-for="item in visibleItems"
        :key="item.id"
        class="flex items-center justify-between py-2 gap-2"
      >
        <span
          :class="['text-sm text-text-primary', !item.is_available ? 'line-through text-text-muted' : '']"
        >
          {{ item.name }}
        </span>
        <span class="text-sm font-medium text-text-primary flex-shrink-0">
          ${{ item.price.toFixed(0) }}
        </span>
      </li>
    </ul>

    <!-- Expand / collapse -->
    <button
      v-if="hasMore && !expanded"
      class="text-sm text-brand-primary hover:underline self-start"
      @click="expanded = true"
    >
      Show all {{ vendor.menu_items.length }} items ↓
    </button>

    <!-- Full menu link -->
    <NuxtLink
      :to="`/vendor/${vendor.id}`"
      class="text-sm font-medium text-center py-2 rounded-button text-brand-primary hover:bg-orange-50 transition-colors"
    >
      Order from full menu →
    </NuxtLink>
  </div>
</template>
