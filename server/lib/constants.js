/** Shared business rules, mirrored from src/data/catalog.js (single source on the server). */

export const DELIVERY_FEE = 500
export const FREE_DELIVERY_OVER = 10000

export const ORDER_STATUSES = [
  { id: 'pending', label: 'Pending' },
  { id: 'paid', label: 'Paid' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'out_for_delivery', label: 'Out for delivery' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
]

/** Only these transitions are valid - enforced server-side (PRD section 9). */
export const STATUS_TRANSITIONS = {
  pending: ['paid', 'cancelled'],
  paid: ['preparing', 'cancelled'],
  preparing: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
}

export const PAYMENT_STATUSES = ['pending', 'verifying', 'paid', 'failed', 'refunded', 'void']

/**
 * All money math for an order happens here - the backend recalculates from
 * live product prices and the promo table and never trusts client totals.
 */
export function calculateOrderTotals(lines, { percentOff = 0 } = {}) {
  const subtotal = lines.reduce((sum, l) => sum + Number(l.product.price) * l.qty, 0)
  const discount = Math.round((subtotal * percentOff) / 100)
  const deliveryFee = subtotal === 0 || subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE
  const total = subtotal - discount + deliveryFee
  return { subtotal, discount, deliveryFee, total }
}
