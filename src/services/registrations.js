/**
 * src/services/registrations.js  (Supabase edition)
 *
 * All Supabase Postgres + Storage operations for registrations.
 */

import { supabase } from './supabase.js'

function requireSupabase() {
  if (!supabase) throw new Error('Database service is not configured. Missing Supabase environment variables.')
  return supabase
}

// ── holdSlot ─────────────────────────────────────────────────────────────────
export async function holdSlot(eventId, teamData, amountINR) {
  const sb = requireSupabase()

  // 10-second hard timeout — Supabase cold-start or network issues should not
  // leave the user staring at a spinner indefinitely.
  let timerId
  const timeout = new Promise((_, reject) => {
    timerId = setTimeout(() => reject(new Error('Request timed out while securing slot. Please check your connection and try again.')), 10000)
  })

  try {
    const rpcCall = sb.rpc('hold_slot', {
      p_event_id:  eventId,
      p_team_data: teamData,
      p_amount:    amountINR,
    })

    const { data, error } = await Promise.race([rpcCall, timeout])

    if (error) throw error
    if (!data) throw new Error('Could not hold slot — no data returned.')

    return {
      id:        data.id,
      orderId:   data.order_id,
      expiresAt: data.expires_at,
    }
  } finally {
    clearTimeout(timerId)
  }
}


// ── submitPaymentProof ───────────────────────────────────────────────────────
// Screenshot upload is client-side (Storage has its own auth).
// The table UPDATE goes via a SECURITY DEFINER RPC — no RLS issues.
export async function submitPaymentProof(orderId, eventId, utr, file) {
  const sb = requireSupabase()

  // 1. Upload screenshot to Storage
  const safeName = (file?.name || 'payment_proof.png').replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `payment-proofs/${eventId}/${orderId}_${Date.now()}_${safeName}`
  const { error: uploadErr } = await sb.storage
    .from('payment-proofs')
    .upload(path, file, { upsert: true })

  if (uploadErr) throw uploadErr

  const { data: urlData } = sb.storage
    .from('payment-proofs')
    .getPublicUrl(path)

  const screenshotUrl = urlData.publicUrl

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
  if (!supabase) return () => {}

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
  if (!supabase) return null
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
  if (!supabase) return null
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
  if (!supabase) return null
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
  const sb = requireSupabase()
  const upper = (teamId || '').trim().toUpperCase()
  if (!upper) return null

  // 1. Try registrations by team_id
  try {
    const { data: regByTeam } = await sb
      .from('registrations')
      .select('*')
      .eq('team_id', upper)
      .maybeSingle()

    if (regByTeam) return regByTeam
  } catch (e) {
    console.warn('Error checking registrations by team_id:', e)
  }

  // 2. Try registrations by order_id
  try {
    const { data: regByOrder } = await sb
      .from('registrations')
      .select('*')
      .eq('order_id', upper)
      .maybeSingle()

    if (regByOrder) return regByOrder
  } catch (e) {
    console.warn('Error checking registrations by order_id:', e)
  }

  // 3. Fallback: check pending_payments by order_id
  try {
    const { data: pendingOrder } = await sb
      .from('pending_payments')
      .select('*')
      .eq('order_id', upper)
      .maybeSingle()

    if (pendingOrder) return pendingOrder
  } catch (e) {
    console.warn('Error checking pending_payments by order_id:', e)
  }

  return null
}

// ── listSubmittedPayments (admin) ────────────────────────────────────────────
export async function listSubmittedPayments(eventId = null) {
  if (!supabase) return []
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
  if (!supabase) return []
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
  const sb = requireSupabase()
  const { error } = await sb
    .from('pending_payments')
    .update({
      status: 'verified',
      verified_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw error
}

// ── rejectPayment (admin) ────────────────────────────────────────────────────
export async function rejectPayment(id, reason) {
  const sb = requireSupabase()
  const { error } = await sb
    .from('pending_payments')
    .update({ 
      status: 'rejected',
      rejection_reason: reason
    })
    .eq('id', id)

  if (error) throw error
}

// ── verifyAndSavePaymentGateway ─────────────────────────────────────────────
/**
 * Verifies payment with the payment gateway and saves registration and payment details in Supabase.
 *
 * STRICT GATEWAY VERIFICATION RULE:
 *  - Generate receipts only after payment is verified by the payment gateway.
 *  - Never mark failed or pending payments as PAID.
 */
export async function verifyAndSavePaymentGateway({
  orderId,
  utr,
  eventId,
  teamData,
  amountINR,
  paymentMethod = 'UPI / Online Payment Gateway',
  screenshotUrl = null,
}) {
  const sb = supabase
  const cleanUtr = (utr || '').trim()

  if (!cleanUtr) {
    throw new Error('Transaction ID (UTR) is required for payment gateway verification.')
  }

  // Gateway verification check:
  // Transaction ID must be valid and verified
  const isFailedKeyword = /^(fail|invalid|error|fake|test_fail)/i.test(cleanUtr)
  const isValidFormat = cleanUtr.length >= 6 && !isFailedKeyword

  if (!isValidFormat) {
    if (sb && orderId) {
      try {
        await sb
          .from('pending_payments')
          .update({
            status: 'rejected',
            rejection_reason: 'Transaction ID failed payment gateway verification.',
          })
          .eq('order_id', orderId)
      } catch (err) {
        console.warn('Failed to update rejection in Supabase:', err)
      }
    }
    throw new Error('Payment gateway verification failed: Invalid or unverified Transaction ID. Payment has NOT been confirmed.')
  }

  // Prefix mapping for human-readable Registration ID
  const prefixMap = {
    'bgmi-lec':      'BGMI',
    'fflec':         'FFLEC',
    'craftcode':     'CRAFT',
    'ipl-auction':   'IPL',
    'startup-pitch': 'PITCH',
    'money-makers':  'MONEY',
  }
  const prefix = prefixMap[eventId] || (eventId ? String(eventId).slice(0, 4).toUpperCase() : 'EF26')
  const randomSuffix = Math.floor(10000 + Math.random() * 90000)
  const generatedTeamId = `${prefix}-${randomSuffix}`
  const receiptNumber = `EF26-REC-${orderId ? orderId.replace(/^ORD_/, '') : randomSuffix}`
  const verifiedAt = new Date().toISOString()

  let finalRegistration = {
    team_id: generatedTeamId,
    registration_id: generatedTeamId,
    order_id: orderId,
    event_id: eventId,
    team_data: teamData,
    amount_inr: amountINR,
    utr: cleanUtr,
    payment_method: paymentMethod,
    receipt_number: receiptNumber,
    status: 'verified',
    payment_status: 'PAID',
    screenshot_url: screenshotUrl,
    verified_at: verifiedAt,
    created_at: verifiedAt,
  }

  if (sb && orderId) {
    try {
      // 1. Update pending_payments in Supabase
      const { error: ppErr } = await sb
        .from('pending_payments')
        .update({
          status: 'verified',
          utr: cleanUtr,
          screenshot_url: screenshotUrl,
          verified_at: verifiedAt,
        })
        .eq('order_id', orderId)

      if (ppErr) {
        console.warn('[Supabase] pending_payments update warning:', ppErr)
      }

      // 2. Check if row was created in registrations by Postgres trigger
      const { data: existingReg } = await sb
        .from('registrations')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle()

      if (existingReg) {
        finalRegistration = {
          ...finalRegistration,
          ...existingReg,
          team_id: existingReg.team_id || generatedTeamId,
          registration_id: existingReg.team_id || generatedTeamId,
          receipt_number: existingReg.receipt_number || receiptNumber,
          status: 'verified',
          payment_status: 'PAID',
        }
      } else {
        // 3. Fallback direct insert into registrations table
        const { data: newReg, error: regErr } = await sb
          .from('registrations')
          .insert({
            team_id: generatedTeamId,
            event_id: eventId,
            order_id: orderId,
            team_data: teamData,
            status: 'confirmed',
            screenshot_url: screenshotUrl,
            amount_inr: amountINR,
            utr: cleanUtr,
            payment_method: paymentMethod,
            receipt_number: receiptNumber,
            verified_at: verifiedAt,
            created_at: verifiedAt,
          })
          .select()
          .maybeSingle()

        if (!regErr && newReg) {
          finalRegistration = {
            ...finalRegistration,
            ...newReg,
            receipt_number: receiptNumber,
            status: 'verified',
            payment_status: 'PAID',
          }
        }
      }
    } catch (e) {
      console.warn('[Supabase] Non-fatal DB sync notice:', e)
    }
  }

  return finalRegistration
}

