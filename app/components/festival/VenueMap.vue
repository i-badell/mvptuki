<script setup lang="ts">
defineProps<{ mapUrl: string | null }>()

const expanded = ref(false)
</script>

<template>
  <div>
    <button
      class="w-full relative h-28 rounded-card overflow-hidden bg-surface-muted border border-gray-200 cursor-pointer"
      aria-label="View venue map"
      @click="expanded = true"
    >
      <NuxtImg
        v-if="mapUrl"
        :src="mapUrl"
        alt="Venue map"
        class="w-full h-full object-cover opacity-90"
        sizes="sm:100vw md:512px"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-text-muted gap-2">
        <span>🗺️</span>
        <span class="text-sm">Map coming soon</span>
      </div>
      <div class="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors">
        <span class="text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
          View map
        </span>
      </div>
    </button>

    <!-- Fullscreen overlay -->
    <AppModal v-model:open="expanded" title="Venue Map">
      <NuxtImg
        v-if="mapUrl"
        :src="mapUrl"
        alt="Venue map"
        class="w-full rounded-lg"
      />
      <p v-else class="text-text-muted text-center py-8">Map not available</p>
    </AppModal>
  </div>
</template>
