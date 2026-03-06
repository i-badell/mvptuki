<script setup lang="ts">
import type { QrVerificationResponse } from '~~/shared/types'

const toast = useToast()
const { scanning, error: scanError, startScanning, stopScanning } = useQrScanner()

const SCANNER_ELEMENT_ID = 'qr-scanner-container'
const lastResult = ref<QrVerificationResponse | null>(null)
const verifying = ref(false)

async function onQrDecoded(token: string) {
  if (verifying.value) return
  verifying.value = true

  // Stop scanning while verifying to avoid duplicate calls
  await stopScanning()

  try {
    const result = await $fetch<QrVerificationResponse>(`/api/qr/${token}`)
    lastResult.value = result
    toast.success(`Collected! — ${result.customerName ?? 'Customer'}`)
  } catch (err: unknown) {
    const statusMessage =
      // @ts-expect-error h3 error shape
      err?.data?.statusMessage ?? err?.statusMessage ?? 'Verification failed'

    if (statusMessage === 'QR_ALREADY_USED') {
      toast.error('This QR code has already been used.')
    } else if (statusMessage === 'ORDER_NOT_READY') {
      toast.error('Order is not ready for pickup yet.')
    } else if (statusMessage === 'QR_NOT_FOUND') {
      toast.error('QR code not recognised.')
    } else {
      toast.error('Verification failed. Please try again.')
    }
  } finally {
    verifying.value = false
  }
}

function startScan() {
  lastResult.value = null
  startScanning(SCANNER_ELEMENT_ID, onQrDecoded)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      :id="SCANNER_ELEMENT_ID"
      class="w-full aspect-square max-w-xs mx-auto rounded-card overflow-hidden bg-surface-muted"
    />

    <!-- Camera error -->
    <p v-if="scanError" class="text-error text-sm text-center">{{ scanError }}</p>

    <!-- Success result -->
    <div v-if="lastResult" class="rounded-card bg-success/10 border border-success/30 p-4">
      <p class="font-semibold text-success">✓ Collected</p>
      <p class="text-sm text-success/80 mt-1">
        {{ lastResult.customerName }} —
        {{ lastResult.items.map((i) => `${i.quantity}× ${i.name}`).join(', ') }}
      </p>
    </div>

    <!-- Controls -->
    <div class="flex gap-3 justify-center">
      <AppButton v-if="!scanning" @click="startScan">Start Camera</AppButton>
      <AppButton v-if="scanning" variant="secondary" @click="stopScanning">Stop</AppButton>
    </div>
  </div>
</template>
