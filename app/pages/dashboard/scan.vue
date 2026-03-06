<script setup lang="ts">
definePageMeta({ layout: 'vendor', middleware: 'vendor-only' })
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-xl font-bold text-text-primary">Scan QR Code</h1>
    <p class="text-sm text-text-muted">
      Point the camera at the customer's QR code to verify pickup.
    </p>

    <ClientOnly>
      <QrScanner />
      <template #fallback>
        <div class="rounded-card bg-surface-muted p-8 text-center text-text-muted text-sm">
          Loading camera...
        </div>
      </template>
    </ClientOnly>
  </div>
  <AppToast />
</template>
