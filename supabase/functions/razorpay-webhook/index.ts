// supabase/functions/razorpay-webhook/index.ts
// Public HTTPS endpoint registered in Razorpay Dashboard → Webhooks.
// This is the REAL security boundary — HMAC-SHA256 signature verified
// before any database write. Invalid/missing signatures are rejected 400.
//
// Secret (never in client code):
//   RAZORPAY_WEBHOOK_SECRET  (supabase secrets set RAZORPAY_WEBHOOK_SECRET=...)
//   SUPABASE_SERVICE_ROLE_KEY (auto-injected)
//   SUPABASE_URL              (auto-injected)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { hmac } from 'https://deno.land/x/hmac@v2.0.1/mod.ts'

serve(async (req) => {
  // Only POST is valid from Razorpay
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''
  const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') ?? ''

  // ── 1. Verify HMAC-SHA256 signature ──────────────────────────
  const expectedSig = hmac('sha256', webhookSecret, rawBody, 'utf8', 'hex')

  if (signature !== expectedSig) {
    console.error('Invalid Razorpay signature — request rejected')
    return new Response('Invalid signature', { status: 400 })
  }

  // ── 2. Parse and handle event ─────────────────────────────────
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const event   = payload.event as string
  const payment = (payload.payload as Record<string, unknown>)?.payment as Record<string, unknown>
  const entity  = payment?.entity as Record<string, unknown>
  const orderId = entity?.order_id as string
  const paymentId = entity?.id as string

  if (!orderId) {
    return new Response('No order_id in payload', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // ── 3. Verify the order exists and is still pending ───────────
  const { data: existingOrder, error: fetchErr } = await supabase
    .from('pending_payments')
    .select('status')
    .eq('order_id', orderId)
    .single()

  if (fetchErr || !existingOrder) {
    console.error('Order not found:', orderId)
    // Return 200 so Razorpay doesn't retry indefinitely for unknown orders
    return new Response('Order not found — acknowledged', { status: 200 })
  }

  if (existingOrder.status !== 'pending') {
    // Already processed (idempotent)
    return new Response('Already processed', { status: 200 })
  }

  // ── 4. Update status based on event ──────────────────────────
  if (event === 'payment.captured' || event === 'payment.authorized') {
    const { error } = await supabase
      .from('pending_payments')
      .update({
        status:              'paid',
        razorpay_payment_id: paymentId,
      })
      .eq('order_id', orderId)

    if (error) {
      console.error('Failed to update to paid:', error)
      // Return 500 so Razorpay retries
      return new Response('DB update failed', { status: 500 })
    }

    console.log(`✓ Payment confirmed: order=${orderId} payment=${paymentId}`)
    // The DB trigger handle_payment_confirmed() now fires automatically
    // and inserts the registrations row. Client's Realtime subscription
    // picks up the status change and advances to Step 3.

  } else if (event === 'payment.failed') {
    await supabase
      .from('pending_payments')
      .update({ status: 'failed' })
      .eq('order_id', orderId)

    console.log(`✗ Payment failed: order=${orderId}`)
  }

  return new Response('OK', { status: 200 })
})
