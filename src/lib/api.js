/**
 * Mock backend.
 *
 * Simulates the Node.js + Express + Supabase layer described in the PRD:
 * every call is async with realistic latency (200–700ms) so the UI shows
 * skeletons instead of flashing content. Data persists to localStorage.
 * In production, replace each function body with a Supabase / REST call.
 * "Server-side" rules (status transitions, payment verification, stock
 * checks) live here — the client never decides them alone.
 */
import { reactive } from 'vue'
import {
  seedCategories,
  seedProducts,
  DEMO_USERS,
  STATUS_TRANSITIONS,
  DELIVERY_FEE,
  FREE_DELIVERY_OVER,
} from '../data/catalog.js'
import { PROMO_CODE, PROMO_DISCOUNT } from '../config/site.js'
import { uid } from './format.js'
import { http, getApiToken, setApiToken } from './http.js'

export { getApiToken, setApiToken }

const LS = {
  products: 'fd_products',
  categories: 'fd_categories',
  orders: 'fd_orders',
  users: 'fd_users',
  session: 'fd_session',
  counter: 'fd_order_counter',
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function persist(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable (private mode) — keep in-memory copy */
  }
}

const db = {
  products: reactive(load(LS.products, seedProducts)),
  categories: reactive(load(LS.categories, seedCategories)),
  orders: reactive(load(LS.orders, seedOrders())),
  users: reactive(load(LS.users, DEMO_USERS)),
}

let orderCounter = load(LS.counter, 1024)
let offline = false
let session = load(LS.session, null)

function seedOrders() {
  const now = Date.now()
  return [
    {
      id: 'o_seed_1',
      number: 1018,
      customerId: 'u-demo',
      customer: {
        name: 'Demo Customer',
        phone: '0803 000 0000',
        email: 'demo@sommybite.com',
      },
      delivery: {
        address: '5 Palm Grove, Ikeja, Lagos',
        city: 'Ikeja',
        state: 'Lagos',
        notes: 'Ring the bell twice.',
      },
      items: [
        { productId: 'p-jollof', name: 'Classic Jollof Rice', price: 3500, qty: 2, emoji: '🍛', hue: 22 },
        { productId: 'p-zobo', name: 'Zobo (Chilled)', price: 700, qty: 2, emoji: '🥤', hue: 340 },
      ],
      subtotal: 8400,
      deliveryFee: 500,
      total: 8900,
      status: 'delivered',
      paymentStatus: 'paid',
      paymentMethod: 'paystack',
      createdAt: new Date(now - 2 * 86400000).toISOString(),
      paidAt: new Date(now - 2 * 86400000 + 60000).toISOString(),
      timeline: [
        { status: 'pending', at: new Date(now - 2 * 86400000).toISOString() },
        { status: 'paid', at: new Date(now - 2 * 86400000 + 60000).toISOString() },
        { status: 'preparing', at: new Date(now - 2 * 86400000 + 3600000).toISOString() },
        { status: 'out_for_delivery', at: new Date(now - 2 * 86400000 + 5400000).toISOString() },
        { status: 'delivered', at: new Date(now - 2 * 86400000 + 7200000).toISOString() },
      ],
    },
    {
      id: 'o_seed_2',
      number: 1021,
      customerId: 'u-demo',
      customer: {
        name: 'Demo Customer',
        phone: '0803 000 0000',
        email: 'demo@sommybite.com',
      },
      delivery: {
        address: '5 Palm Grove, Ikeja, Lagos',
        city: 'Ikeja',
        state: 'Lagos',
        notes: '',
      },
      items: [
        { productId: 'p-chicken', name: 'Grilled Chicken (Half)', price: 3200, qty: 1, emoji: '🍗', hue: 18 },
      ],
      subtotal: 3200,
      deliveryFee: 500,
      total: 3700,
      status: 'preparing',
      paymentStatus: 'paid',
      paymentMethod: 'flutterwave',
      createdAt: new Date(now - 3600000).toISOString(),
      paidAt: new Date(now - 3600000 + 45000).toISOString(),
      timeline: [
        { status: 'pending', at: new Date(now - 3600000).toISOString() },
        { status: 'paid', at: new Date(now - 3600000 + 45000).toISOString() },
        { status: 'preparing', at: new Date(now - 1800000).toISOString() },
      ],
    },
  ]
}

function saveProducts() { persist(LS.products, db.products) }
function saveCategories() { persist(LS.categories, db.categories) }
function saveOrders() { persist(LS.orders, db.orders) }
function saveUsers() { persist(LS.users, db.users) }
function saveSession() { persist(LS.session, session) }
function saveCounter() { persist(LS.counter, orderCounter) }

/* ---------------- real backend (server/) with mock fallback ----------------
 * Every helper below first tries the Express API described in the PRD and
 * silently falls back to the localStorage mock when the API is unreachable,
 * misconfigured, or throws a 5xx - so the site never goes blank. A 4xx from
 * the API (invalid promo, out of stock, not your order) is a real answer and
 * is surfaced to the caller instead of masked by the mock.
 * ------------------------------------------------------------------------- */

function isApiDown(error) {
  return !error || typeof error.status !== 'number' || error.status >= 500
}

function mapProduct(p) {
  return {
    id: p.id,
    name: p.name,
    categoryId: p.category_id,
    price: Number(p.price),
    stock: p.stock,
    description: p.description || '',
    image: p.image,
    emoji: p.emoji,
    hue: p.hue,
    rating: Number(p.rating ?? 0),
    reviews: p.reviews ?? 0,
    tags: p.tags || [],
    featured: p.featured,
    chefSpecial: p.chef_special || false,
    createdAt: p.created_at,
  }
}

function mapOrder(row) {
  return {
    id: row.id,
    number: row.number,
    customerId: row.user_id,
    customer: row.customer || {},
    delivery: row.delivery || {},
    items: (row.order_items || []).map((i) => ({
      productId: i.product_id,
      name: i.name,
      price: Number(i.price),
      qty: i.qty,
      emoji: i.emoji,
      hue: i.hue,
      image: i.image,
    })),
    subtotal: Number(row.subtotal),
    discount: Number(row.discount || 0),
    deliveryFee: Number(row.delivery_fee),
    total: Number(row.total),
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    promoCode: row.promo_code,
    paymentReference: row.payment_reference,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    timeline: row.timeline || [],
  }
}

/** Mirror a backend-created order into the mock store so the demo payment
 *  and confirmation flow (processPayment) keeps working unchanged. */
function rememberOrder(order) {
  db.orders.unshift(order)
  saveOrders()
}

function sortProducts(items, sort) {
  const list = [...items]
  switch (sort) {
    case 'price_asc':
      list.sort((a, b) => a.price - b.price)
      break
    case 'price_desc':
      list.sort((a, b) => b.price - a.price)
      break
    case 'name':
      list.sort((a, b) => a.name.localeCompare(b.name))
      break
    default:
      list.sort((a, b) => Number(b.featured) - Number(a.featured))
  }
  return list
}

/* ---------------- latency & connectivity ---------------- */

export function setOffline(value) {
  offline = value
}

export function isOffline() {
  return offline === true
}

function latency(min = 250, max = 700) {
  const ms = min + Math.random() * (max - min)
  return new Promise((resolve) => setTimeout(resolve, ms))
}

class ApiError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

async function call(fn, opts = {}) {
  await latency(opts.min, opts.max)
  if (offline) throw new ApiError('network', 'You are offline. Check your connection and try again.')
  return fn()
}

/* ---------------- products ---------------- */

export async function listProducts({ q = '', categoryId = '', sort = 'featured' } = {}) {
  try {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (categoryId) params.set('categoryId', categoryId)
    if (sort && sort !== 'featured') params.set('sort', sort)
    const qs = params.toString()
    const data = await http.get(`/products${qs ? `?${qs}` : ''}`)
    return sortProducts((data.products || []).map(mapProduct), sort)
  } catch (e) {
    if (!isApiDown(e)) throw e
    /* API unreachable - fall back to the local catalogue */
  }
  return call(() => {
    const items = [...db.products]
    if (categoryId) items = items.filter((p) => p.categoryId === categoryId)
    if (q) {
      const needle = q.trim().toLowerCase()
      items = items.filter((p) => p.name.toLowerCase().includes(needle))
    }
    return sortProducts(items, sort)
  })
}

export function getProductSync(id) {
  const p = db.products.find((x) => x.id === id)
  return p ? { ...p } : null
}

export async function getProduct(id) {
  try {
    const data = await http.get(`/products/${encodeURIComponent(id)}`)
    return mapProduct(data.product)
  } catch (e) {
    if (!isApiDown(e)) throw e
    /* API unreachable - fall back to the local catalogue */
  }
  return call(() => {
    const p = db.products.find((x) => x.id === id)
    if (!p) throw new ApiError('not_found', 'This product is no longer available.')
    return { ...p }
  })
}

export async function createProduct(data) {
  return call(() => {
    const product = {
      id: data.id || uid('p'),
      ...data,
      createdAt: new Date().toISOString(),
    }
    db.products.unshift(product)
    saveProducts()
    return { ...product }
  })
}

export async function updateProduct(id, data) {
  return call(() => {
    const index = db.products.findIndex((p) => p.id === id)
    if (index === -1) throw new ApiError('not_found', 'Product not found. It may have been deleted.')
    db.products[index] = { ...db.products[index], ...data }
    saveProducts()
    return { ...db.products[index] }
  })
}

export async function deleteProduct(id) {
  return call(() => {
    const index = db.products.findIndex((p) => p.id === id)
    if (index === -1) throw new ApiError('not_found', 'Product not found.')
    const [removed] = db.products.splice(index, 1)
    saveProducts()
    return removed
  })
}

/* ---------------- categories ---------------- */

export function getCategorySync(id) {
  return db.categories.find((c) => c.id === id) || null
}

export async function listCategories() {
  return call(() => [...db.categories])
}

export async function createCategory(name) {
  return call(() => {
    const clean = name.trim()
    if (!clean) throw new ApiError('validation', 'Enter a category name.')
    if (db.categories.some((c) => c.name.toLowerCase() === clean.toLowerCase())) {
      throw new ApiError('validation', 'A category with this name already exists.')
    }
    const category = { id: uid('c'), name: clean, emoji: '🏷️', hue: 260 }
    db.categories.push(category)
    saveCategories()
    return category
  })
}

export async function renameCategory(id, name) {
  return call(() => {
    const category = db.categories.find((c) => c.id === id)
    if (!category) throw new ApiError('not_found', 'Category not found.')
    const clean = name.trim()
    if (!clean) throw new ApiError('validation', 'Enter a category name.')
    category.name = clean
    saveCategories()
    return { ...category }
  })
}

export async function deleteCategory(id) {
  return call(() => {
    const index = db.categories.findIndex((c) => c.id === id)
    if (index === -1) throw new ApiError('not_found', 'Category not found.')
    const using = db.products.filter((p) => p.categoryId === id)
    const removed = db.categories.splice(index, 1)[0]
    // Products fall back to "Uncategorized" rather than being deleted.
    using.forEach((p) => {
      p.categoryId = 'uncategorized'
    })
    saveCategories()
    saveProducts()
    return { removed, affected: using.length }
  })
}

/* ---------------- auth (Supabase Auth stand-in) ---------------- */

export async function login(email, password) {
  return call(() => {
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    if (!user || user.password !== password) {
      throw new ApiError('auth', 'These details do not match our records. Check your email and try again.')
    }
    session = { userId: user.id }
    saveSession()
    return publicUser(user)
  })
}

export async function register(name, email, password) {
  return call(() => {
    const cleanEmail = email.trim().toLowerCase()
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new ApiError('auth', 'An account with this email already exists. Try signing in.')
    }
    const user = {
      id: uid('u'),
      name: name.trim(),
      email: cleanEmail,
      password,
      role: 'customer',
    }
    db.users.push(user)
    saveUsers()
    session = { userId: user.id }
    saveSession()
    return publicUser(user)
  })
}

export function logout() {
  session = null
  saveSession()
}

export function getUserProfileSync(id) {
  const user = db.users.find((u) => u.id === id)
  return user ? { phone: user.phone, address: user.address, city: user.city, state: user.state } : null
}

export function currentUser() {
  if (!session) return null
  const user = db.users.find((u) => u.id === session.userId)
  return user ? publicUser(user) : null
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone || '' }
}

export async function updateProfile(id, data) {
  return call(() => {
    const user = db.users.find((u) => u.id === id)
    if (!user) throw new ApiError('auth', 'Your session expired. Sign in again.')
    Object.assign(user, data)
    saveUsers()
    return publicUser(user)
  })
}

export async function requestPasswordReset(email) {
  return call(() => {
    // In production this sends an email via Supabase Auth.
    return { sent: true }
  })
}

/* ---------------- orders ---------------- */

export async function listOrders({ status = '', q = '', customerId = '' } = {}) {
  if (customerId && getApiToken()) {
    try {
      const data = await http.get('/orders/my', { auth: true })
      let items = (data.orders || []).map(mapOrder)
      if (status && status !== 'all') items = items.filter((o) => o.status === status)
      if (q) {
        const needle = q.trim().toLowerCase()
        items = items.filter((o) => orderNumber(o).toLowerCase().includes(needle))
      }
      return items
    } catch (e) {
      if (!isApiDown(e)) throw e
      /* API unreachable - fall back to local orders */
    }
  }
  return call(() => {
    let items = [...db.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    if (customerId) items = items.filter((o) => o.customerId === customerId)
    if (status && status !== 'all') items = items.filter((o) => o.status === status)
    if (q) {
      const needle = q.trim().toLowerCase()
      items = items.filter((o) => orderNumber(o).toLowerCase().includes(needle))
    }
    return items
  })
}

export function orderNumber(o) {
  return 'FD-' + String(o.number).padStart(5, '0')
}

export async function getOrder(id, customerId = null) {
  return call(() => {
    const order = db.orders.find((o) => o.id === id)
    if (!order) throw new ApiError('not_found', 'This order could not be found.')
    if (customerId && order.customerId !== customerId) {
      throw new ApiError('not_found', 'This order could not be found.')
    }
    return { ...order }
  })
}

export async function createOrder({ customerId, customer, delivery, items, subtotal, deliveryFee, total, paymentMethod, promoCode }) {
  // Signed in with a real Supabase session? Let the server own the money:
  // it re-validates stock, recalculates prices, discounts and totals.
  if (getApiToken()) {
    try {
      const data = await http.post(
        '/orders',
        {
          items: (items || []).map((i) => ({ productId: i.productId, qty: i.qty })),
          customer,
          delivery,
          paymentMethod,
          promoCode: promoCode || null,
        },
        { auth: true },
      )
      const order = mapOrder(data.order)
      rememberOrder(order)
      return order
    } catch (e) {
      if (!isApiDown(e)) throw e
      /* API unreachable - fall back to the local flow below */
    }
  }
  return call(() => {
    // Server-side stock + price revalidation (edge case: stock changed since cart load).
    for (const item of items) {
      const product = db.products.find((p) => p.id === item.productId)
      if (!product) {
        throw new ApiError('stock', `"${item.name}" is no longer available. It was removed from your order.`)
      }
      if (product.stock <= 0) {
        throw new ApiError('stock', `"${item.name}" just sold out. Remove it and try again.`)
      }
      if (product.stock < item.qty) {
        throw new ApiError('stock', `Only ${product.stock} × "${item.name}" left in stock. We adjusted your quantity.`)
      }
    }
    orderCounter += 1
    saveCounter()
    const now = new Date().toISOString()
    const order = {
      id: uid('o'),
      number: orderCounter,
      customerId,
      customer,
      delivery,
      items: items.map((i) => {
        const product = db.products.find((p) => p.id === i.productId)
        return {
          productId: i.productId,
          name: product ? product.name : i.name,
          price: product ? product.price : i.price, // server is source of truth for price
          qty: i.qty,
          emoji: product ? product.emoji : i.emoji,
          hue: product ? product.hue : i.hue,
          image: product ? product.image : i.image,
        }
      }),
      subtotal,
      deliveryFee,
      total,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod,
      createdAt: now,
      timeline: [{ status: 'pending', at: now }],
    }
    db.orders.unshift(order)
    saveOrders()
    return { ...order }
  }, { min: 350, max: 900 })
}

export async function nextStatuses(status) {
  return STATUS_TRANSITIONS[status] || []
}

export async function updateOrderStatus(id, next) {
  return call(() => {
    const order = db.orders.find((o) => o.id === id)
    if (!order) throw new ApiError('not_found', 'Order not found. It may have been updated elsewhere.')
    const allowed = STATUS_TRANSITIONS[order.status] || []
    if (!allowed.includes(next)) {
      throw new ApiError('transition', `Cannot move this order from ${label(order.status)} to ${label(next)}. Choose one of the available next steps.`)
    }
    order.status = next
    order.timeline.push({ status: next, at: new Date().toISOString() })
    if (next === 'cancelled') order.paymentStatus = order.paymentStatus === 'paid' ? 'refunded' : 'void'
    saveOrders()
    return { ...order }
  })
}

function label(status) {
  const map = {
    pending: 'Pending',
    paid: 'Paid',
    preparing: 'Preparing',
    out_for_delivery: 'Out for delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }
  return map[status] || status
}

/* ---------------- payments (Paystack / Flutterwave stand-in) ---------------- */

/**
 * Two-phase payment: authorise → server verifies. The order is shown as
 * "Paid" only after the verify step succeeds (never on the client alone).
 */
export async function processPayment(orderId, method, { fail = false } = {}) {
  // phase 1: redirect to provider (authorise)
  await latency(900, 1400)
  if (offline) throw new ApiError('network', 'You are offline. Connect and try again — your order is saved.')
  if (fail) {
    const order = db.orders.find((o) => o.id === orderId)
    if (order) {
      order.paymentStatus = 'failed'
      saveOrders()
    }
    return { status: 'failed', reason: 'Your card was declined. Try another card or payment method.' }
  }
  // phase 2: server-side verification callback
  await latency(700, 1200)
  const order = db.orders.find((o) => o.id === orderId)
  if (!order) throw new ApiError('not_found', 'Order not found.')
  order.paymentStatus = 'paid'
  order.status = 'paid'
  order.paidAt = new Date().toISOString()
  order.timeline.push({ status: 'paid', at: order.paidAt })
  // decrement stock only after verified payment
  for (const item of order.items) {
    const product = db.products.find((p) => p.id === item.productId)
    if (product) product.stock = Math.max(0, product.stock - item.qty)
  }
  saveOrders()
  saveProducts()
  return { status: 'paid', reference: 'PAY-' + uid('ref').toUpperCase() }
}

export async function submitContact({ name, email, orderNo, message }) {
  return call(() => {
    // In production: POST /api/contact (Express) → send email.
    return { sent: true, reference: 'MSG-' + uid('msg').toUpperCase() }
  })
}

/* ---------------- checkout totals ---------------- */

export function calculateTotals(items) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const deliveryFee = subtotal === 0 ? 0 : subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE
  return { subtotal, deliveryFee, total: subtotal + deliveryFee, freeDeliveryOver: FREE_DELIVERY_OVER }
}

/* ---------------- promo codes (server-validated) ---------------- */

/**
 * SOMMY20-style check. The server (promo_codes table) is the source of truth;
 * offline we fall back to the one public code advertised on the site.
 */
export async function validatePromoCode(code, subtotal = 0) {
  try {
    const data = await http.post('/promo/validate', { code, subtotal })
    return { valid: true, code: data.code, percentOff: data.percentOff, discount: data.discount }
  } catch (e) {
    if (!isApiDown(e)) throw e
    if (String(code).trim().toUpperCase() === PROMO_CODE) {
      return {
        valid: true,
        code: PROMO_CODE,
        percentOff: PROMO_DISCOUNT,
        discount: Math.round((subtotal * PROMO_DISCOUNT) / 100),
      }
    }
    throw new ApiError('validation', 'That promo code is not valid.')
  }
}

/* ---------------- payments via the backend (Paystack) ---------------- */

/**
 * Start a real Paystack transaction for an order the signed-in customer owns.
 * Returns { authorizationUrl, reference, amountKobo } - redirect the browser
 * to authorizationUrl, then poll verifyPayment(reference).
 */
export async function initPayment(orderId) {
  return http.post('/payments/initialize', { orderId }, { auth: true })
}

/** Verify a Paystack reference server-side. Marks the order paid once Paystack confirms. */
export async function verifyPayment(reference) {
  return http.get(`/payments/verify/${encodeURIComponent(reference)}`, { auth: true })
}

/* ---------------- admin API (real backend only — never the localStorage mock) ----------------
 * These hit the authenticated Express endpoints in server/. They do NOT fall back
 * to the local catalogue, so admin screens always show live Supabase data.
 * -------------------------------------------------------------------------- */

// The /api/admin/orders endpoint joins the buyer's profiles row; merge it into the
// customer snapshot so the buyer name/phone are always present.
function mapAdminOrder(row) {
  const order = mapOrder(row)
  const profile = row.profiles || {}
  if (!order.customer) order.customer = {}
  if (!order.customer.name && profile.full_name) order.customer.name = profile.full_name
  if (!order.customer.phone && profile.phone) order.customer.phone = profile.phone
  return order
}

/** GET /api/admin/orders - all orders (optionally filtered by status). */
export async function adminListOrders({ status = '' } = {}) {
  const params = new URLSearchParams()
  if (status && status !== 'all') params.set('status', status)
  const qs = params.toString()
  const data = await http.get(`/admin/orders${qs ? `?${qs}` : ''}`, { auth: true })
  return (data.orders || []).map(mapAdminOrder)
}

/** GET /api/admin/orders/:id - a single order with its line items and buyer. */
export async function adminGetOrder(id) {
  const data = await http.get(`/admin/orders/${encodeURIComponent(id)}`, { auth: true })
  return mapAdminOrder(data.order)
}

/** PATCH /api/orders/:id/status - advance an order to the next valid status. */
export async function adminUpdateOrderStatus(id, nextStatus) {
  const data = await http.patch(`/orders/${encodeURIComponent(id)}/status`, { status: nextStatus }, { auth: true })
  return mapAdminOrder(data.order)
}

/** GET /api/products (with admin token) - all products, including inactive ones. */
export async function adminListProducts() {
  const data = await http.get('/products', { auth: true })
  return (data.products || []).map(mapProduct)
}

/** GET /api/products/:id (with admin token) - one product, even if inactive. */
export async function adminGetProduct(id) {
  const data = await http.get(`/products/${encodeURIComponent(id)}`, { auth: true })
  return mapProduct(data.product)
}

/** POST /api/products - create a product. */
export async function adminCreateProduct(payload) {
  const data = await http.post('/products', payload, { auth: true })
  return mapProduct(data.product)
}

/** PUT /api/products/:id - partial product update (stock, availability, price...). */
export async function adminUpdateProduct(id, payload) {
  const data = await http.patch(`/products/${encodeURIComponent(id)}`, payload, { auth: true })
  return mapProduct(data.product)
}

/** DELETE /api/products/:id. */
export async function adminDeleteProduct(id) {
  await http.del(`/products/${encodeURIComponent(id)}`, { auth: true })
  return true
}
