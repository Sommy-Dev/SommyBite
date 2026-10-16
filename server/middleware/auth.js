import { supabase } from '../lib/supabase.js'

function tokenFrom(req) {
  const header = req.headers.authorization || ''
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null
}

/**
 * Verifies the Supabase JWT with the Auth server (no local secret juggling)
 * and attaches the user to req.user. Rejects with 401 otherwise.
 */
export async function requireAuth(req, res, next) {
  try {
    const token = tokenFrom(req)
    if (!token) {
      return res.status(401).json({ error: 'Missing access token. Sign in and try again.' })
    }
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Your session expired. Sign in again.' })
    }
    req.user = data.user
    next()
  } catch (err) {
    next(err)
  }
}

/**
 * Must run after requireAuth. Checks profiles.role = 'admin' with the
 * service-role client and rejects with 403 otherwise.
 */
export async function requireAdmin(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single()
    if (error || data?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' })
    }
    req.profile = data
    next()
  } catch (err) {
    next(err)
  }
}

/** Best-effort user lookup that never 401s - used to widen read visibility. */
export async function getOptionalUser(req) {
  const token = tokenFrom(req)
  if (!token) return null
  try {
    const { data } = await supabase.auth.getUser(token)
    return data?.user ?? null
  } catch {
    return null
  }
}

export async function isAdminUser(user) {
  if (!user) return false
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin'
}
