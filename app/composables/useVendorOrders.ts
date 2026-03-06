import type { Order, OrderStatus } from '~~/shared/types'

export function useVendorOrders(vendorId: string) {
  const supabase = useSupabaseClient()
  const orders = ref<Order[]>([])
  const pending = ref(true)
  let channel: ReturnType<typeof supabase.channel> | null = null

  async function fetchOrders() {
    pending.value = true
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('vendor_id', vendorId)
      .not('status', 'in', '("collected","cancelled")')
      .order('created_at', { ascending: true })

    if (!error) orders.value = data ?? []
    pending.value = false
  }

  function subscribeToOrders() {
    channel = supabase
      .channel(`vendor-orders:${vendorId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `vendor_id=eq.${vendorId}`,
        },
        (payload) => {
          const newOrder = payload.new as Order
          if (!['collected', 'cancelled'].includes(newOrder.status)) {
            orders.value.push(newOrder)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `vendor_id=eq.${vendorId}`,
        },
        (payload) => {
          const updated = payload.new as Order
          const idx = orders.value.findIndex((o) => o.id === updated.id)
          if (idx !== -1) {
            if (['collected', 'cancelled'].includes(updated.status)) {
              // Remove from active queue
              orders.value.splice(idx, 1)
            } else {
              orders.value[idx] = updated
            }
          }
        }
      )
      .subscribe()
  }

  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .eq('vendor_id', vendorId)

    if (error) throw error
  }

  onMounted(async () => {
    await fetchOrders()
    subscribeToOrders()
  })

  onUnmounted(() => {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
  })

  return { orders, pending, updateOrderStatus, refresh: fetchOrders }
}
