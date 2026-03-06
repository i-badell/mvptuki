// Composable for camera-based QR scanning using html5-qrcode (dynamic import).
// Must only be used client-side (inside <ClientOnly> or onMounted).
export function useQrScanner() {
  const scanning = ref(false)
  const error = ref<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let scanner: any = null

  async function startScanning(elementId: string, onDecoded: (token: string) => void) {
    error.value = null

    try {
      // Dynamic import — avoids SSR build errors (library uses window/navigator)
      const { Html5Qrcode } = await import('html5-qrcode')
      scanner = new Html5Qrcode(elementId)

      const cameras = await Html5Qrcode.getCameras()
      if (!cameras.length) throw new Error('No cameras found on this device.')

      // Prefer back camera
      const cameraId = cameras.find((c) => /back|rear|environment/i.test(c.label))?.id ?? cameras[0].id

      await scanner.start(
        cameraId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          onDecoded(decodedText)
        },
        () => {} // Ignore per-frame errors
      )

      scanning.value = true
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        error.value = 'Camera permission denied. Please allow camera access and try again.'
      } else {
        error.value = err instanceof Error ? err.message : 'Could not start camera.'
      }
    }
  }

  async function stopScanning() {
    if (scanner && scanning.value) {
      await scanner.stop()
      scanner = null
      scanning.value = false
    }
  }

  onUnmounted(() => stopScanning())

  return { scanning, error, startScanning, stopScanning }
}
