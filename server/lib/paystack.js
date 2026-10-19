import axios from 'axios'

/**
 * Paystack REST client. The secret key lives only in this process
 * (server/.env) and is never exposed to the browser.
 */
const secret = (process.env.PAYSTACK_SECRET_KEY || '').trim()

const api = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${secret || ''}`,
    'Content-Type': 'application/json',
  },
  timeout: 20000,
})

// A real key is sk_test_ or sk_live_ followed by real characters.
// Obvious placeholders (sk_test_placeholder, sk_test_xxxxx…) must NOT count
// as configured — the app stays in demo payment mode instead of leaking
// fake credentials to the Paystack API.
const REAL_KEY_RE = /^sk_(test|live)_[A-Za-z0-9_-]+$/

export function paystackConfigured() {
  if (!secret) return false
  if (!REAL_KEY_RE.test(secret)) return false
  if (/placeholder/i.test(secret)) return false
  // reject all-same-character suffixes like sk_test_xxxx…
  const suffix = secret.slice(8)
  if (suffix && /^(.)\1+$/.test(suffix)) return false
  return true
}

/** True when Paystack is not configured with a real key (demo / test mode). */
export function paystackDemoMode() {
  return !paystackConfigured()
}

/**
 * Start a transaction. Amount is in kobo (Paystack convention): N1 = 100 kobo.
 * Returns the Paystack envelope: { status, message, data: { authorization_url, reference, ... } }
 */
export async function initializeTransaction({ email, amountKobo, reference, metadata, callbackUrl }) {
  const { data } = await api.post('/transaction/initialize', {
    email,
    amount: amountKobo,
    reference,
    metadata,
    callback_url: callbackUrl,
  })
  return data
}

/**
 * Verify a transaction by reference. data.data.status === 'success' and
 * data.data.amount (kobo) are what we compare before marking an order paid.
 */
export async function verifyTransaction(reference) {
  const { data } = await api.get(`/transaction/verify/${encodeURIComponent(reference)}`)
  return data
}
