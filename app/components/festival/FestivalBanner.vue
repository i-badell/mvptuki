<script setup lang="ts">
import type { Festival } from "~~/shared/types";

defineProps<{ festival: Festival }>();

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<template>
  <div
    class="relative -mx-4 -mt-4 flex flex-col p-5 overflow-hidden bg-red min-w-[100dvw]"
  >
    <!-- Content -->
    <div class="flex flex-row items-center justify-between w-full">
      <!-- Festival name -->
      <h1 class="font-display w-fit text-white text-4xl my-3">
        {{ festival.name }}
      </h1>

      <div
        class="inline-flex w-fit h-fit items-center gap-1.5 bg-white mb-2 text-red font-medium font-sans uppercase tracking-[1.5px] w-fit rounded-full px-2 py-1 text-xs"
      >
        <span class="w-1.5 h-1.5 bg-red rounded-full animate-pulse" />
        Abierto
      </div>
    </div>

    <!-- Meta row -->
    <div class="flex gap-4 flex-wrap">
      <div
        v-if="festival.description"
        class="flex items-center gap-1 text-white/75 text-sm"
      >
        <svg
          class="flex-shrink-0 fill-white opacity-90"
          style="width: 12px; height: 12px"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"
          />
        </svg>
        {{ festival.description }}
      </div>
      <div
        v-if="festival.starts_at"
        class="flex items-center gap-1 text-white/75"
        style="font-size: 11px"
      >
        <svg
          class="flex-shrink-0 fill-white opacity-90"
          style="width: 12px; height: 12px"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 18a8 8 0 110-16 8 8 0 010 16zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"
          />
        </svg>
        {{ formatTime(festival.starts_at) }}
        <template v-if="festival.ends_at"
          >&nbsp;–&nbsp;{{ formatTime(festival.ends_at) }}</template
        >
      </div>
    </div>
  </div>
</template>
