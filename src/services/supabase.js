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

const rawUrl  = import.meta.env.VITE_SUPABASE_URL
const rawAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabaseUrl  = rawUrl ? rawUrl.replace(/^['"]|['"]$/g, '').trim() : ''
const supabaseAnon = rawAnon ? rawAnon.replace(/^['"]|['"]$/g, '').trim() : ''

const isConfigured = (val) => Boolean(val && !val.includes('YOUR_') && val !== 'undefined' && val !== 'null')

let supabase = null

if (isConfigured(supabaseUrl) && isConfigured(supabaseAnon)) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnon)
  } catch (err) {
    console.warn('[Supabase] Initialisation failed — payment features disabled.', err)
  }
} else {
  console.warn(
    '[Supabase] Missing or unconfigured environment variables — payment/registration features disabled.\n' +
    'Please verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env / Vercel.'
  )
}

export { supabase }
