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
import { uid } from './format.js'

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
  return call(() => {
    let items = [...db.products]
    if (categoryId) items = items.filter((p) => p.categoryId === categoryId)
    if (q) {
      const needle = q.trim().toLowerCase()
      items = items.filter((p) => p.name.toLowerCase().includes(needle))
    }
    switch (sort) {
      case 'price_asc':
        items.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        items.sort((a, b) => b.price - a.price)
        break
      case 'name':
        items.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        items.sort((a, b) => Number(b.featured) - Number(a.featured))
    }
    return items
  })
}

export function getProductSync(id) {
  const p = db.products.find((x) => x.id === id)
  return p ? { ...p } : null
}

export async function getProduct(id) {
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

export async function createOrder({ customerId, customer, delivery, items, subtotal, deliveryFee, total, paymentMethod }) {
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
