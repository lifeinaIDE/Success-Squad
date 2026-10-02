// supabase/functions/create-payment-order/index.ts
//
// Creates a Razorpay Order + a Razorpay UPI QR Code (tracked).
// Returns the QR image URL so the client renders Razorpay's own image.
// When the user pays by scanning it, Razorpay fires qr_code.credited webhook.
//
// Secrets:  RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
//           SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injected)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Server-side authoritative fee map. Client cannot spoof the amount.
const ENTRY_FEE_MAP: Record<string, number> = {
  'bgmi-lec':      199,
  'fflec':         149,
  'hackathon-24h': 299,
  'ipl-auction':   99,
  'startup-pitch': 49,
  'money-makers':  249,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { eventId, teamData } = await req.json()

    if (!eventId || !teamData) {
      return new Response(
        JSON.stringify({ error: 'Missing eventId or teamData' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const amountINR = ENTRY_FEE_MAP[eventId]
    if (amountINR === undefined) {
      return new Response(
        JSON.stringify({ error: `Unknown eventId: ${eventId}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const rzpKeyId     = Deno.env.get('RAZORPAY_KEY_ID')!
    const rzpKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!
    const authHeader   = 'Basic ' + btoa(`${rzpKeyId}:${rzpKeySecret}`)

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)  // 5 minutes
    // QR close_by must be at least 1 minute from now per Razorpay docs
    const qrCloseBy = Math.floor(expiresAt.getTime() / 1000) + 360  // +6 min buffer

    // ── 1. Create Razorpay Order ───────────────────────────────────────────────
    const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify({
        amount:   amountINR * 100,  // paise
        currency: 'INR',
        receipt:  `efest26_${eventId}_${Date.now()}`,
        notes:    { eventId, teamName: teamData.teamName ?? '' },
      }),
    })

    if (!orderRes.ok) {
      const err = await orderRes.text()
      console.error('Razorpay order error:', err)
      return new Response(
        JSON.stringify({ error: 'Failed to create Razorpay order' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const order   = await orderRes.json()
    const orderId = order.id as string

    // ── 2. Create Razorpay UPI QR Code (tracked — fires webhook on payment) ───
    let qrImageUrl: string | null = null
    let qrCodeId:   string | null = null

    const qrRes = await fetch('https://api.razorpay.com/v1/payments/qr_codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify({
        type:             'upi_qr',
        name:             'Success Squad E-Fest',
        usage:            'single_use',       // one-time, auto-closes after payment
        is_fixed_amount:  true,
        payment_amount:   amountINR * 100,    // paise
        description:      `E-Fest ${eventId} registration`,
        close_by:         qrCloseBy,          // Unix timestamp
        reference_id:     orderId,            // links QR → order in our DB
      }),
    })

    if (qrRes.ok) {
      const qrData = await qrRes.json()
      qrImageUrl = qrData.image_url   // Razorpay-hosted QR image
      qrCodeId   = qrData.id
      console.log(`QR created: ${qrCodeId} → order ${orderId}`)
    } else {
      const qrErr = await qrRes.text()
      console.error('QR Code creation failed (will fall back to UPI link):', qrErr)
      // Non-fatal — we fall back to a UPI intent link below
    }

    // ── 3. Write pending_payments row ─────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error: dbError } = await supabase
      .from('pending_payments')
      .insert({
        order_id:    orderId,
        event_id:    eventId,
        team_data:   teamData,
        status:      'pending',
        amount_inr:  amountINR,
        expires_at:  expiresAt.toISOString(),
        qr_code_id:  qrCodeId,           // stored for webhook lookup
      })

    if (dbError) {
      console.error('DB insert error:', dbError)
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 4. Fallback UPI deep link (shown if QR creation failed) ──────────────
    const upiId = '9404337568@upi'
    const upiIntentLink =
      `upi://pay?pa=${encodeURIComponent(upiId)}` +
      `&pn=${encodeURIComponent('Success Squad E-Fest')}` +
      `&tr=${encodeURIComponent(orderId)}` +
      `&am=${amountINR}` +
      `&cu=INR` +
      `&tn=${encodeURIComponent(`E-Fest26-${eventId}`)}`

    return new Response(
      JSON.stringify({
        orderId,
        qrImageUrl,      // Razorpay-tracked QR image URL (preferred)
        upiIntentLink,   // fallback direct UPI link (mobile deep link button)
        expiresAt: expiresAt.toISOString(),
        amountINR,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Unhandled error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
