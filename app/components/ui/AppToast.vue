<script setup lang="ts">
type ToastVariant = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
}

// Global toast state — composable pattern
const toasts = useState<Toast[]>('toasts', () => [])

// Exposed for external use via useToast()
function addToast(message: string, variant: ToastVariant = 'info', duration = 4000) {
  const id = crypto.randomUUID()
  toasts.value.push({ id, message, variant })
  setTimeout(() => removeToast(id), duration)
}

function removeToast(id: string) {
  const idx = toasts.value.findIndex((t) => t.id === id)
  if (idx !== -1) toasts.value.splice(idx, 1)
}

// Provide globally via composable usage
provide('addToast', addToast)

const variantClasses: Record<ToastVariant, string> = {
  success: 'bg-success text-white',
  error: 'bg-error text-white',
  info: 'bg-text-primary text-white',
}

const variantIcons: Record<ToastVariant, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      <TransitionGroup
        enter-active-class="transition-all duration-300"
        enter-from-class="opacity-0 translate-y-2"
        leave-active-class="transition-all duration-200"
        leave-to-class="opacity-0 translate-x-4"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['pointer-events-auto flex items-start gap-2 px-4 py-3 rounded-card shadow-lg text-sm', variantClasses[toast.variant]]"
        >
          <span class="font-bold">{{ variantIcons[toast.variant] }}</span>
          <span class="flex-1">{{ toast.message }}</span>
          <button
            class="opacity-70 hover:opacity-100 ml-2"
            aria-label="Dismiss"
            @click="removeToast(toast.id)"
          >
            ✕
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
