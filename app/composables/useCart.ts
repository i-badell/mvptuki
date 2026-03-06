import type { Cart, CartItem } from '~~/shared/types'

const CART_STORAGE_KEY = 'tuki_cart'

// Singleton reactive cart state
const cart = ref<Cart | null>(null)

function persist() {
  if (import.meta.client) {
    if (cart.value) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart.value))
    } else {
      localStorage.removeItem(CART_STORAGE_KEY)
    }
  }
}

function hydrate() {
  if (import.meta.client) {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (raw) {
      try {
        cart.value = JSON.parse(raw) as Cart
      } catch {
        cart.value = null
      }
    }
  }
}

export function useCart() {
  // Hydrate once on first call
  if (import.meta.client && cart.value === null) {
    hydrate()
  }

  const itemCount = computed(() =>
    cart.value?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0
  )

  const cartTotal = computed(() =>
    cart.value?.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) ?? 0
  )

  // Returns 'ok' or 'vendor_mismatch'
  function addItem(
    vendorId: string,
    vendorName: string,
    item: Omit<CartItem, 'quantity'>,
    qty = 1
  ): 'ok' | 'vendor_mismatch' {
    if (cart.value && cart.value.vendorId !== vendorId) {
      return 'vendor_mismatch'
    }

    if (!cart.value) {
      cart.value = { vendorId, vendorName, items: [] }
    }

    const existing = cart.value.items.find((i) => i.menuItemId === item.menuItemId)
    if (existing) {
      existing.quantity += qty
    } else {
      cart.value.items.push({ ...item, quantity: qty })
    }

    persist()
    return 'ok'
  }

  function removeItem(menuItemId: string) {
    if (!cart.value) return
    cart.value.items = cart.value.items.filter((i) => i.menuItemId !== menuItemId)
    if (cart.value.items.length === 0) cart.value = null
    persist()
  }

  function updateQuantity(menuItemId: string, qty: number) {
    if (!cart.value) return
    if (qty <= 0) {
      removeItem(menuItemId)
      return
    }
    const item = cart.value.items.find((i) => i.menuItemId === menuItemId)
    if (item) {
      item.quantity = qty
      persist()
    }
  }

  function clearCart() {
    cart.value = null
    persist()
  }

  return { cart, itemCount, cartTotal, addItem, removeItem, updateQuantity, clearCart }
}
