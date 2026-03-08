<script setup lang="ts">
defineProps<{ mapUrl: string | null }>()

const expanded = ref(false)
</script>

<template>
  <div>
    <button
      class="w-full relative rounded-lg overflow-hidden cursor-pointer bg-gray-50 transition-all active:translate-x-[3px] active:translate-y-[3px]"
      style="height: 185px; border: 1.5px solid #111111; box-shadow: var(--shadow-md);"
      aria-label="Ver mapa del evento"
      @click="expanded = true"
    >
      <!-- Grid texture -->
      <div
        class="absolute inset-0"
        style="
          background-image:
            linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px);
          background-size: 26px 26px;
        "
      />

      <NuxtImg
        v-if="mapUrl"
        :src="mapUrl"
        alt="Mapa del evento"
        class="absolute inset-0 w-full h-full object-cover opacity-90"
        sizes="sm:100vw md:512px"
      />

      <!-- Entry label -->
      <div
        class="absolute bottom-3 right-3 bg-black text-white rounded-[5px] px-3 py-1 font-bold uppercase tracking-[0.8px]"
        style="font-size: 10px;"
      >
        📍 Entrada principal
      </div>
    </button>

    <AppModal v-model:open="expanded" title="Mapa del evento">
      <NuxtImg
        v-if="mapUrl"
        :src="mapUrl"
        alt="Mapa del evento"
        class="w-full rounded-lg"
      />
      <p v-else class="text-gray-500 text-center py-8">Mapa no disponible</p>
    </AppModal>
  </div>
</template>
