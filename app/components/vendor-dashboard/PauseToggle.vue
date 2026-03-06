<script setup lang="ts">
import type { VendorStatus } from '~~/shared/types'

const props = defineProps<{ vendorId: string; status: VendorStatus }>()
const emit = defineEmits<{ 'update:status': [status: VendorStatus] }>()

const supabase = useSupabaseClient()
const toast = useToast()
const loading = ref(false)
const confirmOpen = ref(false)

const isPaused = computed(() => props.status === 'paused')

async function toggle() {
  confirmOpen.value = false
  loading.value = true

  const next: VendorStatus = isPaused.value ? 'active' : 'paused'

  const { error } = await supabase
    .from('vendors')
    .update({ status: next })
    .eq('id', props.vendorId)

  loading.value = false

  if (error) {
    toast.error('Failed to update availability.')
    return
  }

  emit('update:status', next)
  toast.info(next === 'active' ? 'You are now accepting orders.' : 'Orders paused.')
}
</script>

<template>
  <div class="flex items-center justify-between rounded-card border bg-surface p-4">
    <div>
      <p class="font-semibold text-text-primary text-sm">Order acceptance</p>
      <p class="text-xs text-text-muted mt-0.5">
        {{ isPaused ? 'Not accepting new orders' : 'Accepting orders' }}
      </p>
    </div>

    <div class="flex items-center gap-3">
      <span
        :class="['text-xs font-medium px-2 py-0.5 rounded-full', isPaused ? 'bg-error/10 text-error' : 'bg-success/10 text-success']"
      >
        {{ isPaused ? 'Closed' : 'Open' }}
      </span>
      <button
        :disabled="loading"
        :class="[
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:opacity-50',
          isPaused ? 'bg-gray-300' : 'bg-brand-primary',
        ]"
        role="switch"
        :aria-checked="!isPaused"
        @click="isPaused ? toggle() : (confirmOpen = true)"
      >
        <span
          :class="[
            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
            isPaused ? 'translate-x-1' : 'translate-x-6',
          ]"
        />
      </button>
    </div>

    <!-- Confirm pause -->
    <AppModal
      v-model:open="confirmOpen"
      title="Pause orders?"
      description="New orders will be blocked. Existing orders in your queue won't be affected."
    >
      <template #footer>
        <AppButton variant="secondary" full-width @click="confirmOpen = false">Cancel</AppButton>
        <AppButton variant="danger" full-width :loading="loading" @click="toggle">Pause</AppButton>
      </template>
    </AppModal>
  </div>
</template>
