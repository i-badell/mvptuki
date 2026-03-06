<script setup lang="ts">
const props = defineProps<{ quantity: number; min?: number; max?: number }>()
const emit = defineEmits<{ 'update:quantity': [value: number] }>()

const min = computed(() => props.min ?? 0)
const max = computed(() => props.max ?? 99)

function decrement() {
  if (props.quantity > min.value) emit('update:quantity', props.quantity - 1)
}

function increment() {
  if (props.quantity < max.value) emit('update:quantity', props.quantity + 1)
}
</script>

<template>
  <div class="flex items-center gap-2">
    <button
      :disabled="quantity <= min"
      class="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center text-lg font-medium text-text-primary hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      aria-label="Decrease quantity"
      @click="decrement"
    >
      −
    </button>
    <span class="w-6 text-center text-sm font-semibold text-text-primary">{{ quantity }}</span>
    <button
      :disabled="quantity >= max"
      class="h-8 w-8 rounded-full border border-brand-primary bg-brand-primary flex items-center justify-center text-lg font-medium text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      aria-label="Increase quantity"
      @click="increment"
    >
      +
    </button>
  </div>
</template>
