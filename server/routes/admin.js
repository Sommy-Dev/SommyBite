import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { httpError } from '../lib/errors.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/admin/orders - admin only: every order with its items and buyer.
router.get('/orders', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    let query = supabase
      .from('orders')
      .select('*, order_items(*), profiles(full_name, phone)')
      .order('created_at', { ascending: false })
    if (req.query.status) query = query.eq('status', String(req.query.status))
    const { data, error } = await query
    if (error) throw error
    res.json({ orders: data ?? [] })
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/orders/:id - admin only: a single order with its line items and buyer.
router.get('/orders/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), profiles(full_name, phone)')
      .eq('id', req.params.id)
      .maybeSingle()
    if (error) throw error
    if (!data) throw httpError(404, 'Order not found. It may have been updated elsewhere.')
    res.json({ order: data })
  } catch (err) {
    next(err)
  }
})

export default router
