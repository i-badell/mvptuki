<script setup lang="ts">
const props = defineProps<{ token: string }>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const qrReady = ref(false)
const qrError = ref(false)

onMounted(async () => {
  if (!canvasRef.value) return

  try {
    const QRCode = await import('qrcode')
    await QRCode.toCanvas(canvasRef.value, props.token, {
      width: 240,
      margin: 2,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    })
    qrReady.value = true
  } catch {
    qrError.value = true
  }
})
</script>

<template>
  <div class="rounded-card border bg-surface p-5 flex flex-col items-center gap-3">
    <p class="font-semibold text-text-primary">Show this QR at the stand</p>

    <div class="flex items-center justify-center w-60 h-60 bg-surface-muted rounded-lg">
      <canvas v-show="qrReady" ref="canvasRef" class="rounded" />
      <div v-if="!qrReady && !qrError" class="w-full h-full animate-pulse rounded-lg" />
      <p v-if="qrError" class="text-error text-sm text-center px-4">Failed to generate QR code.</p>
    </div>

    <p class="text-xs text-text-muted">Single-use · Valid for pickup only</p>
  </div>
</template>
