import { reactive, computed } from 'vue'
import * as api from '../lib/api.js'

const CART_KEY = 'fd_cart'

function load() {
  try {
    const raw = localStorage.getItem(CART_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((i) => i && i.productId) : []
  } catch {
    return []
  }
}

function persist() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart.items))
  } catch {
    /* private mode: cart lives in memory only */
  }
}

export const cart = reactive({
  items: load(),
  drawerOpen: false,
})

/** Resolve cart lines against live product data (handles sold-out / price-change edge cases). */
export const cartLines = computed(() => {
  return cart.items
    .map((item) => {
      const product = api.getProductSync(item.productId)
      return {
        productId: item.productId,
        qty: item.qty,
        product,
        available: !!product && product.stock > 0,
        price: product ? product.price : 0,
        lineTotal: product ? product.price * item.qty : 0,
      }
    })
    .filter((line) => line.product) // drop lines for deleted products silently
})

export const cartCount = computed(() => cart.items.reduce((n, i) => n + i.qty, 0))

export const cartTotals = computed(() => {
  const lines = cartLines.value.filter((l) => l.available)
  return api.calculateTotals(lines.map((l) => ({ price: l.price, qty: l.qty })))
})

export function addToCart(productId, qty = 1) {
  const product = api.getProductSync(productId)
  if (!product) return { ok: false, reason: 'Product no longer exists.' }
  if (product.stock <= 0) return { ok: false, reason: 'Sold out.' }
  const existing = cart.items.find((i) => i.productId === productId)
  const nextQty = (existing ? existing.qty : 0) + qty
  if (nextQty > product.stock) {
    if (existing) existing.qty = product.stock
    else cart.items.push({ productId, qty: product.stock })
    persist()
    return { ok: false, reason: `Only ${product.stock} available — quantity capped at stock.` }
  }
  if (existing) existing.qty = nextQty
  else cart.items.push({ productId, qty })
  persist()
  return { ok: true }
}

export function setQty(productId, qty) {
  const product = api.getProductSync(productId)
  const max = product ? product.stock : 99
  const clamped = Math.min(Math.max(1, qty), Math.max(1, max))
  const existing = cart.items.find((i) => i.productId === productId)
  if (existing) existing.qty = clamped
  persist()
}

/** Remove a line and return it so the caller can offer Undo. */
export function removeFromCart(productId) {
  const index = cart.items.findIndex((i) => i.productId === productId)
  if (index === -1) return null
  const [removed] = cart.items.splice(index, 1)
  persist()
  return removed
}

export function restoreCartItem(item, index = 0) {
  const product = api.getProductSync(item.productId)
  if (!product || product.stock <= 0) return false
  cart.items.splice(Math.min(index, cart.items.length), 0, {
    productId: item.productId,
    qty: Math.min(item.qty, product.stock),
  })
  persist()
  return true
}

export function clearCart() {
  cart.items.splice(0, cart.items.length)
  persist()
}

export function openDrawer() {
  cart.drawerOpen = true
}

export function closeDrawer() {
  cart.drawerOpen = false
}
