/**
 * src/services/supabase.js
 *
 * Initialises the Supabase client only when env vars are present.
 * If missing (e.g. Vercel without vars configured), returns a null stub
 * so the rest of the app renders normally — same guard pattern as firebase.js.
 *
 * VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are safe for client exposure.
 * RLS policies on every table are the actual security layer.
 * NEVER put SUPABASE_SERVICE_ROLE_KEY in client code.
 *
 * Get your values from:
 *   Supabase Dashboard → Project Settings → API
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase = null

if (supabaseUrl && supabaseAnon) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnon)
  } catch (err) {
    console.warn('[Supabase] Initialisation failed — payment features disabled.', err)
  }
} else {
  console.warn(
    '[Supabase] Missing env vars — payment/registration features disabled.\n' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel project settings.'
  )
}

export { supabase }
