<script setup lang="ts">
defineProps<{
  open: boolean
  currentVendorName: string
  newVendorName: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
}>()

function cancel() {
  emit('update:open', false)
}

function confirm() {
  emit('confirm')
  emit('update:open', false)
}
</script>

<template>
  <AppModal
    :open="open"
    title="Start new cart?"
    :description="`Your cart has items from ${currentVendorName}. Starting a new cart from ${newVendorName} will remove them.`"
    @update:open="emit('update:open', $event)"
  >
    <template #footer>
      <AppButton variant="secondary" full-width @click="cancel">Keep current cart</AppButton>
      <AppButton variant="danger" full-width @click="confirm">Clear and switch</AppButton>
    </template>
  </AppModal>
</template>
