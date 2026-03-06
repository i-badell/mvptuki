import type { Order } from '~~/shared/types'

type UpdateCallback = (updated: Partial<Order>) => void

export function useOrderRealtime(orderId: string, onUpdate: UpdateCallback) {
  const supabase = useSupabaseClient()
  let channel: ReturnType<typeof supabase.channel> | null = null

  function subscribeToOrder() {
    channel = supabase
      .channel(`order:${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          onUpdate(payload.new as Partial<Order>)
        }
      )
      .subscribe()
  }

  onUnmounted(() => {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
  })

  return { subscribeToOrder }
}
