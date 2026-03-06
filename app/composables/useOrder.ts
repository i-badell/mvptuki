import type { OrderWithDetails, Order } from '~~/shared/types'

export function useOrder() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  async function fetchOrder(orderId: string): Promise<OrderWithDetails | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*, menu_item:menu_items(name, image_url)),
        qr_codes(*),
        vendor:vendors(id, name, location_hint, logo_url)
      `)
      .eq('id', orderId)
      .eq('customer_id', user.value?.id ?? '')
      .single()

    if (error) return null
    return data as unknown as OrderWithDetails
  }

  async function fetchOrders(): Promise<Order[]> {
    if (!user.value) return []

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', user.value.id)
      .order('created_at', { ascending: false })

    if (error) return []
    return data ?? []
  }

  return { fetchOrder, fetchOrders }
}
