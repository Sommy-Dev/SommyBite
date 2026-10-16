import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error(
    '[supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      '          Copy server/.env.example to server/.env and fill in your keys.',
  )
}

/**
 * Service-role client: bypasses Row Level Security, so every admin action and
 * every money calculation happens here. This key must NEVER reach the browser.
 */
export const supabase = createClient(url || 'https://placeholder.supabase.co', serviceKey || 'placeholder-key', {
  auth: { persistSession: false, autoRefreshToken: false },
})

/** True when real Supabase credentials are configured. */
export const supabaseConfigured = Boolean(url && serviceKey && !url.includes('placeholder'))
