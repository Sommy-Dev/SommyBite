/**
 * Tiny fetch helper for the SommyBite Express backend (server/).
 *
 * - Base URL comes from VITE_API_URL (see .env). When it is missing the
 *   helper throws immediately, so callers can fall back to the local mock
 *   and the site never goes blank.
 * - Every request has an 8s timeout (AbortController).
 * - Auth requests attach the Supabase access token from localStorage
 *   (key: sb_access_token), set by a future Supabase Auth login.
 */

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
const TOKEN_KEY = 'sb_access_token'

export function apiBaseUrl() {
  return BASE
}

export function getApiToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setApiToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable - stay in mock mode */
  }
}

async function request(path, { method = 'GET', body, auth = false, timeout = 8000 } = {}) {
  if (!BASE) throw new Error('VITE_API_URL is not configured')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const headers = {}
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    const token = getApiToken()
    if (auth && token) headers.Authorization = `Bearer ${token}`

    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    if (!res.ok) {
      let message = `Request failed (${res.status})`
      try {
        const data = await res.json()
        if (data?.error) message = data.error
      } catch {
        /* non-JSON error body - keep the status message */
      }
      const err = new Error(message)
      err.status = res.status
      throw err
    }
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

export const http = {
  get: (path, opts) => request(path, opts),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
}
