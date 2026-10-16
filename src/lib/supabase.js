/**
 * Supabase browser client (the ONLY place the frontend talks to Supabase).
 *
 * Reads exactly two Vite env vars from the root .env:
 *   VITE_SUPABASE_URL      - Project URL   (Project Settings -> API)
 *   VITE_SUPABASE_ANON_KEY - anon public key (Project Settings -> API)
 *
 * The anon key is safe in the browser; the service role key and Paystack
 * secret key stay server-side in server/.env and are never imported here.
 * When either variable is missing the client is null and `supabaseConfigured`
 * is false, so the Auth page can show a clear message instead of failing
 * silently. Only the two names above are read - no other env var is used.
 */
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(url && anonKey)

if (!supabaseConfigured) {
  console.error(
    '[supabase] Not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
      'to your root .env file (Supabase dashboard -> Project Settings -> API), ' +
      'then restart the dev server.',
  )
}

export const supabase = supabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null
