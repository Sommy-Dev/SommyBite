import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { httpError } from '../lib/errors.js'
import { STATUS_TRANSITIONS, calculateOrderTotals } from '../lib/constants.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

/**
 * POST /api/orders - authenticated customer only.
 * Prices, stock, promo discount, delivery fee and total are ALL recomputed
 * here from the database. Totals sent by the client are ignored.
 */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { items, customer, delivery, paymentMethod, promoCode } = req.body || {}

    if (!Array.isArray(items) || items.length === 0) {
      throw httpError(400, 'Your cart is empty.')
    }

    // Accept only productId + qty from the client (names/prices are untrusted).
    const requested = items
      .map((i) => ({
        productId: String(i?.productId ?? ''),
        qty: Number(i?.qty),
        label: String(i?.name ?? 'This item'), // for error messages only
      }))
      .filter((i) => i.productId && Number.isInteger(i.qty) && i.qty > 0)

    if (requested.length === 0) {
      throw httpError(400, 'No valid items in your cart.')
    }

    // Fetch live products; the database price is the single source of truth.
    const ids = [...new Set(requested.map((i) => i.productId))]
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', ids)
    if (productsError) throw productsError

    const byId = new Map((products ?? []).map((p) => [p.id, p]))
    const lines = []
    for (const item of requested) {
      const product = byId.get(item.productId)
      if (!product) {
        throw httpError(409, `"${item.label}" is no longer available. It was removed from your order.`)
      }
      if (!product.active) {
        throw httpError(409, `"${product.name}" is not currently available.`)
      }
      if (product.stock <= 0) {
        throw httpError(409, `"${product.name}" just sold out. Remove it and try again.`)
      }
      if (product.stock < item.qty) {
        throw httpError(409, `Only ${product.stock} x "${product.name}" left in stock. We adjusted your quantity.`)
      }
      lines.push({ product, qty: item.qty })
    }

    // Promo codes are validated server-side; an invalid code fails the order.
    let percentOff = 0
    let appliedPromo = null
    if (promoCode) {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('code, percent_off')
        .eq('code', String(promoCode).trim().toUpperCase())
        .eq('active', true)
        .maybeSingle()
      if (!promo) {
        throw httpError(400, 'That promo code is not valid.')
      }
      appliedPromo = promo
      percentOff = Number(promo.percent_off)
    }

    const { subtotal, discount, deliveryFee, total } = calculateOrderTotals(lines, { percentOff })
    const now = new Date().toISOString()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: req.user.id,
        status: 'pending',
        payment_status: 'pending',
        payment_method: paymentMethod ? String(paymentMethod) : null,
        subtotal,
        discount,
        delivery_fee: deliveryFee,
        total,
        promo_code: appliedPromo ? appliedPromo.code : null,
        customer: customer ?? {},
        delivery: delivery ?? {},
        timeline: [{ status: 'pending', at: now }],
      })
      .select()
      .single()
    if (orderError) throw orderError

    const itemRows = lines.map((l) => ({
      order_id: order.id,
      product_id: l.product.id,
      name: l.product.name,
      price: l.product.price,
      qty: l.qty,
      emoji: l.product.emoji,
      hue: l.product.hue,
      image: l.product.image,
    }))
    const { error: itemsError } = await supabase.from('order_items').insert(itemRows)
    if (itemsError) {
      // Roll back the header so an order is never left without its lines.
      await supabase.from('orders').delete().eq('id', order.id)
      throw itemsError
    }

    res.status(201).json({ order: { ...order, order_items: itemRows } })
  } catch (err) {
    next(err)
  }
})

// GET /api/orders/my - the signed-in customer's own orders only.
router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json({ orders: data ?? [] })
  } catch (err) {
    next(err)
  }
})

/**
 * PATCH /api/orders/:id/status - admin only.
 * Enforces the STATUS_TRANSITIONS map server-side (you cannot jump
 * Pending -> Delivered) and keeps the timeline trail.
 */
router.patch('/:id/status', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const next = String(req.body?.status ?? '')
    if (!Object.prototype.hasOwnProperty.call(STATUS_TRANSITIONS, next)) {
      throw httpError(400, 'Unknown order status.')
    }

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle()
    if (fetchError) throw fetchError
    if (!order) throw httpError(404, 'Order not found. It may have been updated elsewhere.')

    const allowed = STATUS_TRANSITIONS[order.status] ?? []
    if (!allowed.includes(next)) {
      throw httpError(
        409,
        `Cannot move this order from ${order.status} to ${next}. Choose one of the available next steps.`,
      )
    }

    const timeline = Array.isArray(order.timeline) ? order.timeline : []
    timeline.push({ status: next, at: new Date().toISOString() })

    const update = { status: next, timeline }
    if (next === 'cancelled') {
      update.payment_status = order.payment_status === 'paid' ? 'refunded' : 'void'
    }
    if (next === 'paid' && order.payment_status !== 'paid') {
      update.payment_status = 'paid'
      update.paid_at = new Date().toISOString()
    }

    const { data: updated, error: updateError } = await supabase
      .from('orders')
      .update(update)
      .eq('id', order.id)
      .select()
      .single()
    if (updateError) throw updateError

    res.json({ order: updated })
  } catch (err) {
    next(err)
  }
})

export default router
