import axios from 'axios'

/**
 * Paystack REST client. The secret key lives only in this process
 * (server/.env) and is never exposed to the browser.
 */
const secret = process.env.PAYSTACK_SECRET_KEY

const api = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${secret || ''}`,
    'Content-Type': 'application/json',
  },
  timeout: 20000,
})

export function paystackConfigured() {
  return Boolean(secret)
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
