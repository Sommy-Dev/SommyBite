import { reactive, computed } from 'vue'
import { supabase, supabaseConfigured } from '../lib/supabase.js'
import { setApiToken } from '../lib/http.js'
import * as api from '../lib/api.js'

export const auth = reactive({
  user: null,
  ready: false,
})

export const isAuthenticated = computed(() => !!auth.user)
export const isAdmin = computed(() => auth.user?.role === 'admin')

function mapUser(suUser, profile) {
  const meta = suUser?.user_metadata || {}
  return {
    id: suUser.id,
    email: suUser.email,
    name: profile?.full_name || meta?.full_name || suUser?.email || '',
    role: profile?.role || meta?.role || 'customer',
    phone: profile?.phone || meta?.phone || '',
  }
}

async function loadProfile(id) {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, phone, role')
    .eq('id', id)
    .single()
  if (error) {
    console.warn('[auth] profile lookup failed:', error.message)
    return null
  }
  return data
}

async function setUserFromSession(session) {
  if (!session?.user) {
    auth.user = null
    setApiToken(null)
    return null
  }
  // Mirror the access token so the Express backend (server/) can verify the JWT.
  setApiToken(session.access_token)
  const profile = await loadProfile(session.user.id)
  const user = mapUser(session.user, profile)
  auth.user = user
  return user
}

function requireSupabase() {
  if (!supabaseConfigured || !supabase) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env, then restart the dev server.',
    )
  }
}

/**
 * Restore the Supabase session on refresh / app start so guarded routes
 * keep working after a reload. Safe to call even when Supabase is unconfigured.
 */
export async function initAuth() {
  auth.ready = false
  try {
    if (!supabaseConfigured || !supabase) {
      auth.user = null
      return
    }
    const { data: { session } } = await supabase.auth.getSession()
    await setUserFromSession(session)
    // Keep the app user in sync as the Supabase session changes.
    supabase.auth.onAuthStateChange((_event, session) => {
      setUserFromSession(session)
    })
  } catch (e) {
    console.error('[auth] init failed:', e?.message || e)
    auth.user = null
  } finally {
    auth.ready = true
  }
}

export async function login(email, password) {
  requireSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  const user = await setUserFromSession(data.session)
  if (!user) throw new Error('Sign in failed. Check your credentials and try again.')
  return user
}

export async function register(name, email, password) {
  requireSupabase()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  })
  if (error) throw error
  // signUp only returns a session when email confirmation is disabled.
  // When it's enabled the account isn't usable until the user confirms the email.
  if (!data.session) {
    throw new Error('Check your email for a confirmation link, then sign in.')
  }
  const user = await setUserFromSession(data.session)
  if (!user) throw new Error('Account created, but signing in failed. Try signing in again.')
  return user
}

export async function logout() {
  if (supabaseConfigured && supabase) {
    await supabase.auth.signOut()
  }
  setApiToken(null)
  auth.user = null
  api.logout()
}

/** Save contact + address to the user profile so checkout can prefill. */
export async function saveDeliveryProfile(id, fields) {
  const user = await api.updateProfile(id, fields)
  if (auth.user && auth.user.id === id) auth.user = user
  return user
}
