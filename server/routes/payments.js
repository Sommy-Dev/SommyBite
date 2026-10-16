import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { httpError } from '../lib/errors.js'
import { initializeTransaction, paystackConfigured, verifyTransaction } from '../lib/paystack.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const toKobo = (naira) => Math.round(Number(naira) * 100)

async function fetchOwnedOrder(req, idOrReference) {
  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', idOrReference)
    .maybeSingle()
  if (!order) return null
  if (order.user_id !== req.user.id) return null
  return order
}

/**
 * POST /api/payments/initialize - authenticated order owner only.
 * The charge amount is recomputed from the order's server-calculated total
 * (never from the request body).
 */
router.post('/initialize', requireAuth, async (req, res, next) => {
  try {
    const order = await fetchOwnedOrder(req, String(req.body?.orderId ?? ''))
    if (!order) throw httpError(404, 'Order not found.')
    if (order.payment_status === 'paid') {
      return res.json({ alreadyPaid: true, order })
    }
    if (!paystackConfigured()) {
      throw httpError(503, 'Paystack is not configured on the server. Add PAYSTACK_SECRET_KEY to server/.env.')
    }

    const amountKobo = toKobo(order.total)
    if (amountKobo < 100) throw httpError(400, 'Order total is too small to charge.')

    const reference = `SB-${order.id}-${Date.now()}`
    const result = await initializeTransaction({
      email: order.customer?.email || req.user.email,
      amountKobo,
      reference,
      metadata: { orderId: order.id, orderNumber: order.number },
      callbackUrl: process.env.PAYSTACK_CALLBACK_URL || undefined,
    })
    if (!result?.status || !result?.data?.authorization_url) {
      throw httpError(502, result?.message || 'Paystack could not start this payment.')
    }

    await supabase
      .from('orders')
      .update({ payment_status: 'verifying', payment_reference: reference })
      .eq('id', order.id)

    res.json({
      authorizationUrl: result.data.authorization_url,
      reference: result.data.reference,
      amountKobo,
    })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/payments/verify/:reference - authenticated owner only.
 * Trusts Paystack's verify response (amount + success status), marks the
 * order paid, appends the timeline entry and decrements stock exactly once.
 */
router.get('/verify/:reference', requireAuth, async (req, res, next) => {
  try {
    if (!paystackConfigured()) {
      throw httpError(503, 'Paystack is not configured on the server. Add PAYSTACK_SECRET_KEY to server/.env.')
    }
    const reference = String(req.params.reference ?? '')
    const { data: order } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('payment_reference', reference)
      .maybeSingle()
    if (!order) throw httpError(404, 'Payment not found for this reference.')
    if (order.user_id !== req.user.id) throw httpError(403, 'You can only verify your own payments.')

    // Idempotency: an already-paid order never decrements stock twice.
    if (order.payment_status === 'paid') {
      return res.json({ status: 'paid', order })
    }

    const result = await verifyTransaction(reference)
    const txn = result?.data
    const expectedKobo = toKobo(order.total)

    if (txn?.status === 'success' && Number(txn.amount) === expectedKobo) {
      const now = new Date().toISOString()
      const timeline = Array.isArray(order.timeline) ? order.timeline : []
      timeline.push({ status: 'paid', at: now })

      const { data: updated, error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: order.status === 'pending' ? 'paid' : order.status,
          paid_at: now,
          timeline,
        })
        .eq('id', order.id)
        .select()
        .single()
      if (error) throw error

      // Decrement stock only now, after verified payment (PRD section 11).
      for (const item of order.order_items ?? []) {
        if (!item.product_id) continue
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .maybeSingle()
        if (product) {
          await supabase
            .from('products')
            .update({ stock: Math.max(0, Number(product.stock) - item.qty) })
            .eq('id', item.product_id)
        }
      }

      return res.json({ status: 'paid', order: updated })
    }

    await supabase.from('orders').update({ payment_status: 'failed' }).eq('id', order.id)
    res.json({
      status: 'failed',
      message: txn?.gateway_response || 'Payment could not be verified. Try again or use another method.',
    })
  } catch (err) {
    next(err)
  }
})

export default router
