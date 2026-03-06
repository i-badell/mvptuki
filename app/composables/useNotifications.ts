// Handles "Ready for Pickup" in-app alerts and optional Web Push notifications (FR-018).
export function useNotifications() {
  const toast = useToast()

  function checkAndNotify() {
    // In-app alert via toast (always)
    toast.success('🎉 Your order is ready for pickup!')

    // Web Push (if permission already granted)
    if (import.meta.client && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Tuki — Ready for Pickup! 🎉', {
        body: 'Your order is ready. Head to the stand!',
        icon: '/icons/icon-192.png',
      })
    }
  }

  async function requestPushPermission(): Promise<boolean> {
    if (!import.meta.client || !('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    const result = await Notification.requestPermission()
    return result === 'granted'
  }

  return { checkAndNotify, requestPushPermission }
}
