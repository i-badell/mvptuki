<script setup lang="ts">
import type { VendorWithFeaturedItems } from '~~/shared/types'

defineProps<{ vendor: VendorWithFeaturedItems }>()
</script>

<template>
  <div
    :class="[
      'rounded-card border bg-surface p-4 flex flex-col gap-3 transition-opacity',
      vendor.status === 'paused' ? 'opacity-60' : '',
    ]"
  >
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
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h3 class="font-semibold text-text-primary truncate">{{ vendor.name }}</h3>
          <span
            v-if="vendor.status === 'paused'"
            class="text-xs bg-gray-100 text-text-muted px-2 py-0.5 rounded-full flex-shrink-0"
          >
            Closed
          </span>
        </div>
        <p v-if="vendor.location_hint" class="text-xs text-text-muted truncate">
          📍 {{ vendor.location_hint }}
        </p>
      </div>
    </div>

    <!-- Featured items (≤5) -->
    <div v-if="vendor.menu_items.length" class="flex flex-wrap gap-2">
      <span
        v-for="item in vendor.menu_items"
        :key="item.id"
        class="text-xs bg-surface-muted text-text-primary px-2 py-1 rounded-full"
      >
        {{ item.name }} · ${{ item.price.toFixed(0) }}
      </span>
    </div>
    <p v-else class="text-xs text-text-muted">No featured items</p>

    <!-- View full menu link -->
    <NuxtLink
      :to="`/vendor/${vendor.id}`"
      :class="[
        'text-sm font-medium text-center py-2 rounded-button transition-colors',
        vendor.status === 'paused'
          ? 'text-text-muted cursor-not-allowed pointer-events-none bg-surface-muted'
          : 'text-brand-primary hover:bg-orange-50',
      ]"
    >
      {{ vendor.status === 'paused' ? 'Currently closed' : 'View full menu →' }}
    </NuxtLink>
  </div>
</template>
