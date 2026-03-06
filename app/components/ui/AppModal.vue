<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    description?: string
  }>(),
  {
    open: false,
  }
)

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

function close() {
  emit('update:open', false)
}

// Close on Escape key
onMounted(() => {
  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && props.open) close()
  }
  window.addEventListener('keydown', handleKey)
  onUnmounted(() => window.removeEventListener('keydown', handleKey))
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40" @click="close" />

        <!-- Panel -->
        <div
          class="relative w-full max-w-sm bg-surface rounded-t-2xl sm:rounded-card shadow-xl p-6 z-10"
        >
          <!-- Header -->
          <div v-if="title || $slots.header" class="mb-4">
            <slot name="header">
              <h2 class="text-lg font-semibold text-text-primary">{{ title }}</h2>
              <p v-if="description" class="text-sm text-text-muted mt-1">{{ description }}</p>
            </slot>
          </div>

          <!-- Body -->
          <slot />

          <!-- Footer -->
          <div v-if="$slots.footer" class="mt-4 flex gap-3">
            <slot name="footer" />
          </div>

          <!-- Close button -->
          <button
            class="absolute top-4 right-4 p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors"
            aria-label="Close modal"
            @click="close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
