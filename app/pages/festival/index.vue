<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const { festival, vendors, pending, error } = useFestival()

const isSingleVendor = computed(() => vendors.value.length === 1)
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Loading skeleton -->
    <template v-if="pending">
      <div class="h-44 rounded-card bg-surface-muted animate-pulse" />
      <div class="h-28 rounded-card bg-surface-muted animate-pulse" />
      <div class="h-40 rounded-card bg-surface-muted animate-pulse" />
    </template>

    <!-- Error state -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-text-muted text-sm">{{ error }}</p>
      <AppButton class="mt-4" @click="refresh">Try again</AppButton>
    </div>

    <!-- Festival content -->
    <template v-else-if="festival">
      <!-- FR-005: Banner -->
      <FestivalBanner :banner-url="festival.banner_url" :festival-name="festival.name" />

      <!-- FR-005: Venue map -->
      <VenueMap :map-url="festival.map_url" />

      <!-- FR-007: Single vendor — condensed inline menu -->
      <template v-if="isSingleVendor">
        <h2 class="text-lg font-semibold text-text-primary">Menu</h2>
        <SingleVendorMenu :vendor="vendors[0]" />
      </template>

      <!-- FR-006: Multi-vendor — vendor cards with featured items -->
      <template v-else>
        <h2 class="text-lg font-semibold text-text-primary">
          Vendors
          <span class="text-sm font-normal text-text-muted ml-1">({{ vendors.length }})</span>
        </h2>
        <div class="flex flex-col gap-4">
          <VendorCard v-for="vendor in vendors" :key="vendor.id" :vendor="vendor" />
        </div>
      </template>
    </template>

    <!-- No active festival -->
    <div v-else class="text-center py-16">
      <p class="text-4xl mb-4">🎪</p>
      <p class="text-text-muted">No active festival right now. Check back soon!</p>
    </div>
  </div>
</template>
