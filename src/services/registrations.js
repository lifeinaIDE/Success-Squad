/**
 * src/services/registrations.js  (Supabase edition)
 *
 * All Supabase Postgres + Storage + Edge Function operations for registrations.
 *
 * Public API:
 *  createPaymentOrder(eventId, teamData)
 *    → invokes create-payment-order Edge Function
 *    → returns { orderId, upiIntentLink, expiresAt, amountINR }
 *
 *  subscribeToOrderStatus(orderId, onUpdate)
 *    → Supabase Realtime subscription on pending_payments row
 *    → returns unsubscribe function for useEffect cleanup
 *
 *  expireOrder(orderId)
 *    → invokes expire-order Edge Function
 *
 *  getRegistrationByOrderId(orderId)
 *    → fetches from registrations table by order_id (after payment confirmed)
 *
 *  getRegistrationByTeamId(teamId)
 *    → fetches from registrations table by team_id (for status lookup page)
 *
 *  uploadScreenshot(teamId, eventId, file)
 *    → uploads to Supabase Storage, updates registrations.screenshot_url
 *
 *  listRegistrations(eventId?)
 *    → admin: fetch all registrations (optionally by event)
 *
 *  markVerified(id)
 *    → admin: set status='verified', verified_at=now()
 */

import { supabase } from './supabase.js'

// Guard: throw a clear error if Supabase isn't configured yet
function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.')
  return supabase
}

// ── createPaymentOrder ───────────────────────────────────────────────────────
export async function createPaymentOrder(eventId, teamData) {
  const sb = requireSupabase()
  const { data, error } = await sb.functions.invoke('create-payment-order', {
    body: { eventId, teamData },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

  return data // { orderId, upiIntentLink, expiresAt, amountINR }
}

// ── subscribeToOrderStatus ───────────────────────────────────────────────────
/**
 * Sets up a Supabase Realtime subscription on the pending_payments row.
 * Fires onUpdate(newRow) whenever the row is updated.
 * Returns a cleanup function — call it in useEffect return.
 *
 * @param {string}   orderId
 * @param {Function} onUpdate — receives the updated row object
 * @returns {Function} unsubscribe
 */
export function subscribeToOrderStatus(orderId, onUpdate) {
  const channel = supabase
    .channel(`order-status-${orderId}`)
    .on(
      'postgres_changes',
      {
        event:  'UPDATE',
        schema: 'public',
        table:  'pending_payments',
        filter: `order_id=eq.${orderId}`,
      },
      (payload) => {
        onUpdate(payload.new)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// ── expireOrder ──────────────────────────────────────────────────────────────
export async function expireOrder(orderId) {
  const { data, error } = await supabase.functions.invoke('expire-order', {
    body: { orderId },
  })
  if (error) throw error
  return data
}

// ── getRegistrationByOrderId ─────────────────────────────────────────────────
/**
 * Called by ConfirmationStep after the Realtime sub confirms 'paid'.
 * The DB trigger has already inserted the registrations row by this point.
 */
export async function getRegistrationByOrderId(orderId) {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('order_id', orderId)
    .single()

  if (error) throw error
  return data
}

// ── getRegistrationByTeamId ──────────────────────────────────────────────────
export async function getRegistrationByTeamId(teamId) {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('team_id', teamId.toUpperCase())
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = 0 rows
  return data ?? null
}

// ── uploadScreenshot ─────────────────────────────────────────────────────────
export async function uploadScreenshot(teamId, eventId, file) {
  const path = `payment-proofs/${eventId}/${teamId}_${Date.now()}_${file.name}`

  const { error: uploadErr } = await supabase.storage
    .from('payment-proofs')
    .upload(path, file, { upsert: true })

  if (uploadErr) throw uploadErr

  const { data: urlData } = supabase.storage
    .from('payment-proofs')
    .getPublicUrl(path)

  const screenshotUrl = urlData.publicUrl

  // Update the registrations row
  const { error: updateErr } = await supabase
    .from('registrations')
    .update({ screenshot_url: screenshotUrl })
    .eq('team_id', teamId)

  if (updateErr) throw updateErr
  return screenshotUrl
}

// ── listRegistrations (admin) ─────────────────────────────────────────────────
export async function listRegistrations(eventId = null) {
  let query = supabase
    .from('registrations')
    .select('*')
    .order('created_at', { ascending: false })

  if (eventId) {
    query = query.eq('event_id', eventId)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

// ── markVerified (admin) ──────────────────────────────────────────────────────
export async function markVerified(id) {
  const { error } = await supabase
    .from('registrations')
    .update({
      status:      'verified',
      verified_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error
}
