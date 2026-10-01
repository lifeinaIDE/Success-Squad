// supabase/functions/create-payment-order/index.ts
// Deno Edge Function — runs on Supabase free tier, no Blaze plan needed.
// Secrets (never in client code):
//   RAZORPAY_KEY_ID      (set via: supabase secrets set RAZORPAY_KEY_ID=...)
//   RAZORPAY_KEY_SECRET  (set via: supabase secrets set RAZORPAY_KEY_SECRET=...)
//   SUPABASE_SERVICE_ROLE_KEY (automatically injected by Supabase)
//   SUPABASE_URL          (automatically injected by Supabase)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Entry fee map — server-side, authoritative. Client cannot spoof the amount.
const ENTRY_FEE_MAP: Record<string, number> = {
  'bgmi-lec':      199,
  'fflec':         149,
  'hackathon-24h': 299,
  'ipl-auction':   99,
  'startup-pitch': 0,
  'mun':           249,
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

    // ── Call Razorpay Orders API ──────────────────────────────
    const rzpKeyId     = Deno.env.get('RAZORPAY_KEY_ID')!
    const rzpKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + btoa(`${rzpKeyId}:${rzpKeySecret}`),
      },
      body: JSON.stringify({
        amount:   amountINR * 100,  // paise
        currency: 'INR',
        receipt:  `efest26_${eventId}_${Date.now()}`,
        notes:    { eventId, teamName: teamData.teamName ?? '' },
      }),
    })

    if (!razorpayRes.ok) {
      const err = await razorpayRes.text()
      console.error('Razorpay error:', err)
      return new Response(
        JSON.stringify({ error: 'Failed to create Razorpay order' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const order = await razorpayRes.json()
    const orderId = order.id as string

    // ── Write pending_payments row (service_role, bypasses RLS) ──
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error: dbError } = await supabase
      .from('pending_payments')
      .insert({
        order_id:   orderId,
        event_id:   eventId,
        team_data:  teamData,
        status:     'pending',
        amount_inr: amountINR,
        expires_at: expiresAt.toISOString(),
      })

    if (dbError) {
      console.error('DB insert error:', dbError)
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Build UPI intent deep link (unique per order) ─────────
    const upiId       = '9404337568@upi'
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
        upiIntentLink,
        expiresAt:  expiresAt.toISOString(),
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
