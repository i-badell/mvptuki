import type { MenuItem, Vendor } from '~~/shared/types'

export function useMenu(vendorId: string) {
  const supabase = useSupabaseClient()
  const items = ref<MenuItem[]>([])
  const vendor = ref<Vendor | null>(null)
  const pending = ref(true)
  const error = ref<string | null>(null)

  async function fetchMenu() {
    pending.value = true
    error.value = null

    try {
      const [vendorRes, itemsRes] = await Promise.all([
        supabase.from('vendors').select('*').eq('id', vendorId).single(),
        supabase
          .from('menu_items')
          .select('*')
          .eq('vendor_id', vendorId)
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true }),
      ])

      if (vendorRes.error) throw vendorRes.error
      if (itemsRes.error) throw itemsRes.error

      vendor.value = vendorRes.data
      items.value = itemsRes.data ?? []
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to load menu'
    } finally {
      pending.value = false
    }
  }

  onMounted(() => fetchMenu())

  return { items, vendor, pending, error, refresh: fetchMenu }
}
