<script setup lang="ts">
defineProps<{
  bannerUrl: string | null
  festivalName: string
}>()
</script>

<template>
  <div class="relative w-full h-44 rounded-card overflow-hidden bg-surface-muted">
    <NuxtImg
      v-if="bannerUrl"
      :src="bannerUrl"
      :alt="festivalName"
      class="w-full h-full object-cover"
      sizes="sm:100vw md:512px"
      loading="eager"
    />
    <div v-else class="w-full h-full flex items-center justify-center text-text-muted">
      <span class="text-4xl">🎪</span>
    </div>

    <!-- Festival name overlay -->
    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
      <h1 class="text-white font-bold text-xl drop-shadow">{{ festivalName }}</h1>
    </div>
  </div>
</template>
