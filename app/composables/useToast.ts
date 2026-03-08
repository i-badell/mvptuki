// Composable to trigger global toasts from any component.
// AppToast.vue must be mounted (it is, in default/vendor layouts) for this to work.
type ToastVariant = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
}


export function useToast() {
  
const toasts = useState<Toast[]>('toasts', () => [])
  function show(message: string, variant: ToastVariant = 'info', duration = 4000) {
    const id = crypto.randomUUID()
    toasts.value.push({ id, message, variant })
    setTimeout(() => {
      const idx = toasts.value.findIndex((t) => t.id === id)
      if (idx !== -1) toasts.value.splice(idx, 1)
    }, duration)
  }

  return {
    success: (msg: string) => show(msg, 'success'),
    error: (msg: string) => show(msg, 'error'),
    info: (msg: string) => show(msg, 'info'),
  }
}
