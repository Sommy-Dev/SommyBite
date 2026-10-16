import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { escapeLike, httpError } from '../lib/errors.js'
import { getOptionalUser, isAdminUser, requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

/** Parse + validate a product write body (POST = full, PUT = partial). */
function parseProductPayload(body, partial) {
  const data = {}
  const errors = []

  if (!partial || body.name !== undefined) {
    const name = String(body.name ?? '').trim()
    if (name.length < 2) errors.push('Enter a product name (2+ characters).')
    else data.name = name
  }
  if (!partial || body.price !== undefined) {
    const price = Number(body.price)
    if (!Number.isFinite(price) || price < 0) errors.push('Enter a valid price (0 or more).')
    else data.price = price
  }
  if (body.description !== undefined) data.description = String(body.description ?? '')
  if (body.categoryId !== undefined) data.category_id = body.categoryId ? String(body.categoryId) : null
  if (body.image !== undefined) data.image = body.image ? String(body.image) : null
  if (body.emoji !== undefined) data.emoji = body.emoji ? String(body.emoji) : null
  if (body.hue !== undefined) {
    const hue = Number(body.hue)
    if (Number.isFinite(hue) && hue >= 0 && hue <= 360) data.hue = hue
  }
  if (body.stock !== undefined) {
    const stock = Number(body.stock)
    if (!Number.isInteger(stock) || stock < 0) errors.push('Stock must be a whole number of 0 or more.')
    else data.stock = stock
  }
  if (body.featured !== undefined) data.featured = Boolean(body.featured)
  if (body.chefSpecial !== undefined) data.chef_special = Boolean(body.chefSpecial)
  if (body.active !== undefined) data.active = Boolean(body.active)
  if (body.tags !== undefined) {
    data.tags = Array.isArray(body.tags) ? body.tags.map((t) => String(t)).filter(Boolean) : []
  }
  if (body.rating !== undefined) {
    const rating = Number(body.rating)
    if (Number.isFinite(rating) && rating >= 0 && rating <= 5) data.rating = rating
  }
  if (body.reviews !== undefined) {
    const reviews = Number(body.reviews)
    if (Number.isInteger(reviews) && reviews >= 0) data.reviews = reviews
  }
  if (errors.length > 0) throw httpError(400, errors[0])
  return data
}

// GET /api/products - public list. Admins (valid token) also see inactive rows.
router.get('/', async (req, res, next) => {
  try {
    const user = await getOptionalUser(req)
    const asAdmin = await isAdminUser(user)

    let query = supabase.from('products').select('*')
    if (!asAdmin) query = query.eq('active', true)
    if (req.query.category) query = query.eq('category_id', String(req.query.category))
    if (req.query.q) query = query.ilike('name', `%${escapeLike(req.query.q)}%`)

    const sort = String(req.query.sort || 'featured')
    if (sort === 'price_asc' || sort === 'price_desc') {
      query = query.order('price', { ascending: sort === 'price_asc' })
    } else if (sort === 'name') {
      query = query.order('name')
    } else {
      query = query.order('featured', { ascending: false })
    }
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) throw error
    res.json({ products: data ?? [] })
  } catch (err) {
    next(err)
  }
})

// GET /api/products/:id - public read of one product.
router.get('/:id', async (req, res, next) => {
  try {
    const user = await getOptionalUser(req)
    const asAdmin = await isAdminUser(user)

    let query = supabase.from('products').select('*').eq('id', req.params.id)
    if (!asAdmin) query = query.eq('active', true)
    const { data, error } = await query.maybeSingle()
    if (error) throw error
    if (!data) throw httpError(404, 'This product is no longer available.')
    res.json({ product: data })
  } catch (err) {
    next(err)
  }
})

// POST /api/products - admin only.
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const payload = parseProductPayload(req.body || {}, false)
    const { data, error } = await supabase.from('products').insert(payload).select().single()
    if (error) throw error
    res.status(201).json({ product: data })
  } catch (err) {
    next(err)
  }
})

// PUT /api/products/:id - admin only, partial update.
router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const payload = parseProductPayload(req.body || {}, true)
    if (Object.keys(payload).length === 0) throw httpError(400, 'No changes to save.')
    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', req.params.id)
      .select()
      .maybeSingle()
    if (error) throw error
    if (!data) throw httpError(404, 'Product not found. It may have been deleted.')
    res.json({ product: data })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/products/:id - admin only.
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id)
      .select()
      .maybeSingle()
    if (error) throw error
    if (!data) throw httpError(404, 'Product not found. It may have been deleted.')
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

export default router
