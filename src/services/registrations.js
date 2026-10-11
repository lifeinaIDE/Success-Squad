/**
 * src/services/registrations.js  (Supabase edition)
 *
 * All Supabase Postgres + Storage operations for registrations.
 */

import { supabase } from './supabase.js'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

// ── holdSlot ─────────────────────────────────────────────────────────────────
export async function holdSlot(eventId, teamData, amountINR) {
  const sb = requireSupabase()

  // 12-second hard timeout - Supabase cold-start or network issues should not
  // leave the user staring at a spinner indefinitely.
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out. Check your connection and try again.')), 12000)
  )

  const rpcCall = sb.rpc('hold_slot', {
    p_event_id:  eventId,
    p_team_data: teamData,
    p_amount:    amountINR,
  })

  const { data, error } = await Promise.race([rpcCall, timeout])

  if (error) throw error
  if (!data) throw new Error('Could not hold slot, no data returned.')

  return {
    id:        data.id,
    orderId:   data.order_id,
    expiresAt: data.expires_at,
  }
}


// ── submitPaymentProof ───────────────────────────────────────────────────────
// Screenshot upload is client-side (Storage has its own auth).
// The table UPDATE goes via a SECURITY DEFINER RPC - no RLS issues.
export async function submitPaymentProof(orderId, eventId, utr, file) {
  const sb = requireSupabase()

  // 1. Upload screenshot to Cloudinary
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary environment variables are missing.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', `payment-proofs/${eventId}`)

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

  const cloudinaryRes = await fetch(cloudinaryUrl, {
    method: 'POST',
    body: formData
  })

  const cloudinaryData = await cloudinaryRes.json()

  if (!cloudinaryRes.ok) {
    throw new Error(cloudinaryData.error?.message || 'Failed to upload screenshot to Cloudinary')
  }

  const screenshotUrl = cloudinaryData.secure_url

  // 2. Update pending_payments via SECURITY DEFINER RPC (bypasses RLS)
  const { error: rpcErr } = await sb.rpc('submit_payment_proof', {
    p_order_id:       orderId,
    p_utr:            utr,
    p_screenshot_url: screenshotUrl,
  })

  if (rpcErr) throw rpcErr

  return screenshotUrl
}


// ── subscribeToOrderStatus ───────────────────────────────────────────────────
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
  const { data, error } = await supabase
    .from('pending_payments')
    .update({ status: 'expired' })
    .eq('order_id', orderId)
    .eq('status', 'pending')

  if (error) throw error
  return data
}

// ── getPendingPaymentByOrderId ───────────────────────────────────────────────
export async function getPendingPaymentByOrderId(orderId) {
  const { data, error } = await supabase
    .from('pending_payments')
    .select('*')
    .eq('order_id', orderId)
    .single()

  if (error) throw error
  return data
}

// ── getRegistrationByOrderId ─────────────────────────────────────────────────
export async function getRegistrationByOrderId(orderId) {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('order_id', orderId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

// ── getRegistrationByTeamId ──────────────────────────────────────────────────
export async function getRegistrationByTeamId(teamId) {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('team_id', teamId.toUpperCase())
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

// ── listSubmittedPayments (admin) ────────────────────────────────────────────
export async function listSubmittedPayments(eventId = null) {
  let query = supabase
    .from('pending_payments')
    .select('*')
    .eq('status', 'submitted')
    .order('created_at', { ascending: true })

  if (eventId) {
    query = query.eq('event_id', eventId)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

// ── listRegistrations (admin) ────────────────────────────────────────────────
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

// ── verifyPayment (admin) ────────────────────────────────────────────────────
export async function verifyPayment(id) {
  const { error } = await supabase
    .from('pending_payments')
    .update({ status: 'verified' })
    .eq('id', id)

  if (error) throw error
}

// ── rejectPayment (admin) ────────────────────────────────────────────────────
export async function rejectPayment(id, reason) {
  const { error } = await supabase
    .from('pending_payments')
    .update({ 
      status: 'rejected',
      rejection_reason: reason
    })
    .eq('id', id)

  if (error) throw error
}
