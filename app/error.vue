<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const is404 = computed(() => props.error.statusCode === 404)

function handleBack() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-4 text-center">
    <p class="text-6xl font-bold text-brand-primary mb-2">
      {{ error.statusCode }}
    </p>
    <h1 class="text-xl font-semibold text-text-primary mb-2">
      {{ is404 ? 'Page not found' : 'Something went wrong' }}
    </h1>
    <p class="text-text-muted mb-6 max-w-xs">
      {{ is404 ? "We couldn't find what you were looking for." : 'An unexpected error occurred. Please try again.' }}
    </p>
    <button
      class="px-6 py-2 rounded-button bg-brand-primary text-white font-medium"
      @click="handleBack"
    >
      Back to home
    </button>
  </div>
</template>
