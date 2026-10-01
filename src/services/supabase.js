/**
 * src/services/supabase.js
 *
 * Initialises the Supabase client.
 * - VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are safe for client exposure.
 *   RLS policies on every table are the actual security layer.
 * - NEVER put SUPABASE_SERVICE_ROLE_KEY in client code or .env.local —
 *   it lives only in Supabase Edge Function secrets.
 *
 * Get your project URL and anon key from:
 *   Supabase Dashboard → Project Settings → API
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnon) {
  console.warn(
    '[Supabase] Missing env vars — payment/registration features disabled.\n' +
    'Copy .env.example → .env.local and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

// createClient is safe to call with empty strings — it returns a client that
// will fail gracefully at the operation level rather than crashing the module.
export const supabase = createClient(
  supabaseUrl  ?? '',
  supabaseAnon ?? ''
)
