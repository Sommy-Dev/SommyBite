import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { httpError } from '../lib/errors.js'

const router = Router()

/**
 * POST /api/promo/validate - checks a code against the promo_codes table.
 * The discount shown here is only a preview: POST /api/orders re-validates
 * the code and recomputes the discount server-side.
 */
router.post('/validate', async (req, res, next) => {
  try {
    const code = String(req.body?.code ?? '').trim().toUpperCase()
    if (!code) throw httpError(400, 'Enter a promo code.')

    const { data: promo, error } = await supabase
      .from('promo_codes')
      .select('code, percent_off')
      .eq('code', code)
      .eq('active', true)
      .maybeSingle()
    if (error) throw error
    if (!promo) throw httpError(400, `"${code}" is not a valid promo code.`)

    const subtotal = Number(req.body?.subtotal) || 0
    const discount = Math.round((subtotal * promo.percent_off) / 100)

    res.json({
      valid: true,
      code: promo.code,
      percentOff: Number(promo.percent_off),
      discount,
      subtotalAfterDiscount: Math.max(0, subtotal - discount),
    })
  } catch (err) {
    next(err)
  }
})

export default router
