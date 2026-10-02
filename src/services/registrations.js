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
  
  const { data, error } = await sb.rpc('hold_slot', {
    p_event_id: eventId,
    p_team_data: teamData,
    p_amount: amountINR
  })

  if (error) throw error
  if (!data) throw new Error("Could not hold slot")

  return {
    id: data.id,
    orderId: data.order_id,
    expiresAt: data.expires_at
  }
}

// ── submitPaymentProof ───────────────────────────────────────────────────────
export async function submitPaymentProof(orderId, eventId, utr, file) {
  const sb = requireSupabase()
  
  // 1. Upload screenshot
  const path = `payment-proofs/${eventId}/${orderId}_${Date.now()}_${file.name}`
  const { error: uploadErr } = await sb.storage
    .from('payment-proofs')
    .upload(path, file, { upsert: true })

  if (uploadErr) throw uploadErr

  const { data: urlData } = sb.storage
    .from('payment-proofs')
    .getPublicUrl(path)
  
  const screenshotUrl = urlData.publicUrl

  // 2. Update pending_payments row
  const { error: updateErr } = await sb
    .from('pending_payments')
    .update({ 
      utr, 
      screenshot_url: screenshotUrl,
      status: 'submitted' 
    })
    .eq('order_id', orderId)
    .eq('status', 'pending')

  if (updateErr) throw updateErr
  
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
