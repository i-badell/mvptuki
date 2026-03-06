<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const route = useRoute()
const vendorId = route.params.vendorId as string

const { items, vendor, pending, error } = useMenu(vendorId)
</script>

<template>
  <div>
    <!-- Loading -->
    <template v-if="pending">
      <div class="h-24 rounded-card bg-surface-muted animate-pulse mb-4" />
      <div v-for="i in 4" :key="i" class="h-24 rounded-card bg-surface-muted animate-pulse mb-3" />
    </template>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-text-muted text-sm">{{ error }}</p>
    </div>

    <!-- Menu -->
    <template v-else-if="vendor">
      <!-- Vendor header -->
      <div class="flex items-center gap-3 mb-5">
        <button class="text-brand-primary" aria-label="Go back" @click="$router.back()">← Back</button>
      </div>

      <div class="flex items-center gap-3 mb-4">
        <div class="h-16 w-16 rounded-full overflow-hidden bg-surface-muted flex-shrink-0">
          <NuxtImg
            v-if="vendor.logo_url"
            :src="vendor.logo_url"
            :alt="vendor.name"
            class="h-full w-full object-cover"
          />
          <div v-else class="h-full w-full flex items-center justify-center text-2xl">🍽️</div>
        </div>
        <div>
          <h1 class="text-xl font-bold text-text-primary">{{ vendor.name }}</h1>
          <p v-if="vendor.location_hint" class="text-sm text-text-muted">📍 {{ vendor.location_hint }}</p>
        </div>
      </div>

      <!-- Paused banner -->
      <div
        v-if="vendor.status === 'paused'"
        class="bg-yellow-50 border border-yellow-200 rounded-card px-4 py-3 mb-4 text-sm text-yellow-700"
      >
        This vendor is currently closed and not accepting orders.
      </div>

      <!-- Item list -->
      <div v-if="items.length">
        <MenuItemCard
          v-for="item in items"
          :key="item.id"
          :item="item"
          :vendor-id="vendorId"
          :vendor-name="vendor.name"
        />
      </div>
      <p v-else class="text-center text-text-muted py-8 text-sm">No items available</p>
    </template>
  </div>
</template>
