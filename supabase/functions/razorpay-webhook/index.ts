// supabase/functions/razorpay-webhook/index.ts
// Public HTTPS endpoint registered in Razorpay Dashboard → Webhooks.
// Uses Deno's built-in Web Crypto API for HMAC-SHA256 — no external imports.
//
// Secrets (set via: supabase secrets set ...):
//   RAZORPAY_WEBHOOK_SECRET
//   SUPABASE_SERVICE_ROLE_KEY (auto-injected by Supabase)
//   SUPABASE_URL              (auto-injected by Supabase)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── HMAC-SHA256 using native Deno Web Crypto (no external deps) ───────────────
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const enc     = new TextEncoder()
  const keyData = enc.encode(secret)
  const msgData = enc.encode(body)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData)
  const hashHex   = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return hashHex === signature
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const rawBody        = await req.text()
  const signature      = req.headers.get('x-razorpay-signature') ?? ''
  const webhookSecret  = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') ?? ''

  // ── 1. Verify HMAC-SHA256 signature ──────────────────────────────────────
  const valid = await verifySignature(rawBody, signature, webhookSecret)
  if (!valid) {
    console.error('Invalid Razorpay signature — request rejected')
    return new Response('Invalid signature', { status: 400 })
  }

  // ── 2. Parse payload ──────────────────────────────────────────────────────
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const event     = payload.event as string
  const payment   = (payload.payload as Record<string, unknown>)?.payment as Record<string, unknown>
  const entity    = payment?.entity as Record<string, unknown>
  const orderId   = entity?.order_id as string
  const paymentId = entity?.id as string

  if (!orderId) {
    return new Response('No order_id in payload', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // ── 3. Verify the order exists and is pending ─────────────────────────────
  const { data: existingOrder, error: fetchErr } = await supabase
    .from('pending_payments')
    .select('status')
    .eq('order_id', orderId)
    .single()

  if (fetchErr || !existingOrder) {
    console.error('Order not found:', orderId)
    return new Response('Order not found — acknowledged', { status: 200 })
  }

  if (existingOrder.status !== 'pending') {
    return new Response('Already processed', { status: 200 })
  }

  // ── 4. Update status ──────────────────────────────────────────────────────
  if (event === 'payment.captured' || event === 'payment.authorized') {
    const { error } = await supabase
      .from('pending_payments')
      .update({ status: 'paid', razorpay_payment_id: paymentId })
      .eq('order_id', orderId)

    if (error) {
      console.error('DB update failed:', error)
      return new Response('DB update failed', { status: 500 })
    }
    console.log(`✓ Payment confirmed: order=${orderId} payment=${paymentId}`)
    // DB trigger handle_payment_confirmed() fires here automatically

  } else if (event === 'payment.failed') {
    await supabase
      .from('pending_payments')
      .update({ status: 'failed' })
      .eq('order_id', orderId)
    console.log(`✗ Payment failed: order=${orderId}`)
  }

  return new Response('OK', { status: 200 })
})
