import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { httpError } from '../lib/errors.js'
import {
  initializeTransaction,
  paystackDemoMode,
  paystackConfigured,
  verifyTransaction,
} from '../lib/paystack.js'
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

/** Mark an order Paid in Supabase: statuses, timeline entry + stock decrement. */
async function markOrderPaid(order) {
  const now = new Date().toISOString()
  const timeline = Array.isArray(order.timeline) ? [...order.timeline, { status: 'paid', at: now }] : []

  const { data: updated, error: updateError } = await supabase
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
  if (updateError) throw updateError

  // Decrement stock only now, after verified payment.
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

  return updated
}

/**
 * GET /api/payments/mode - public config probe so the checkout can label the
 * payment flow as "Demo payment (test mode)" instead of pretending a bank is
 * involved, without first having to create an order.
 */
router.get('/mode', (_req, res) => {
  res.json({
    configured: paystackConfigured(),
    demoMode: paystackDemoMode(),
  })
})

/**
 * POST /api/payments/initialize - authenticated order owner only.
 * The charge amount is recomputed from the order's server-calculated total
 * (never from the request body).
 *
 * In demo mode (Paystack key missing/placeholder) a reference is minted and the
 * order is set to "verifying" without calling Paystack. In live mode a real
 * authorization URL is returned for an off-site redirect.
 */
router.post('/initialize', requireAuth, async (req, res, next) => {
  try {
    const order = await fetchOwnedOrder(req, String(req.body?.orderId ?? ''))
    if (!order) throw httpError(404, 'Order not found.')
    if (order.payment_status === 'paid') {
      return res.json({ alreadyPaid: true, order })
    }

    const amountKobo = toKobo(order.total)
    if (amountKobo < 100) throw httpError(400, 'Order total is too small to charge.')

    const reference = `SB-${order.id}-${Date.now()}`
    const simulateDecline = Boolean(req.body?.simulateDecline)

    if (paystackDemoMode()) {
      await supabase
        .from('orders')
        .update({ payment_status: 'verifying', payment_reference: reference })
        .eq('id', order.id)

      return res.json({
        demoMode: true,
        reference,
        amountKobo,
        simulateDecline,
      })
    }

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
 * Trusts Paystack's verify response (amount + success status) when configured,
 * and simulates the same contract in demo mode (incl. simulateDecline query
 * param) so the "declined card" demo still works without a real Paystack key.
 */
router.get('/verify/:reference', requireAuth, async (req, res, next) => {
  try {
    const simulateDecline = req.query.simulateDecline === 'true'
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

    if (paystackDemoMode()) {
      if (simulateDecline) {
        await supabase.from('orders').update({ payment_status: 'failed' }).eq('id', order.id)
        return res.json({
          status: 'failed',
          message: 'Your card was declined. Try another card or payment method.',
        })
      }
      const updated = await markOrderPaid(order)
      return res.json({ status: 'paid', order: updated })
    }

    // Real Paystack verification
    const result = await verifyTransaction(reference)
    const txn = result?.data
    const expectedKobo = toKobo(order.total)

    if (txn?.status === 'success' && Number(txn.amount) === expectedKobo) {
      const updated = await markOrderPaid(order)
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
