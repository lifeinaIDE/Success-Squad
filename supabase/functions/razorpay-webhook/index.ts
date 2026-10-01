// supabase/functions/razorpay-webhook/index.ts
//
// Handles two event types:
//   qr_code.credited  → user scanned Razorpay QR and paid  ← PRIMARY
//   payment.captured  → fallback in case order-based payment used
//   payment.failed    → mark order as failed
//
// Signature verification uses Deno native Web Crypto (no external deps).

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const enc     = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(body))
  const hashHex   = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex === signature
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const rawBody       = await req.text()
  const signature     = req.headers.get('x-razorpay-signature') ?? ''
  const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') ?? ''

  // ── 1. Verify HMAC-SHA256 signature ──────────────────────────────────────
  const valid = await verifySignature(rawBody, signature, webhookSecret)
  if (!valid) {
    console.error('Invalid Razorpay signature')
    return new Response('Invalid signature', { status: 400 })
  }

  let payload: Record<string, unknown>
  try { payload = JSON.parse(rawBody) } catch { return new Response('Invalid JSON', { status: 400 }) }

  const event = payload.event as string
  console.log(`Webhook event: ${event}`)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // ── 2. Handle qr_code.credited  ──────────────────────────────────────────
  // This fires when the user pays by scanning our Razorpay QR code.
  if (event === 'qr_code.credited') {
    const pld       = payload.payload as Record<string, unknown>
    const qrEntity  = (pld?.qr_code as Record<string, unknown>)?.entity as Record<string, unknown>
    const payEntity = (pld?.payment  as Record<string, unknown>)?.entity as Record<string, unknown>

    const referenceId = qrEntity?.reference_id as string   // we set this = orderId
    const paymentId   = payEntity?.id as string

    if (!referenceId) {
      console.error('qr_code.credited: no reference_id in payload')
      return new Response('OK', { status: 200 })  // ack so Razorpay stops retrying
    }

    console.log(`qr_code.credited: order=${referenceId} payment=${paymentId}`)

    // Check not already processed
    const { data: existing } = await supabase
      .from('pending_payments')
      .select('status')
      .eq('order_id', referenceId)
      .single()

    if (existing?.status !== 'pending') {
      return new Response('Already processed', { status: 200 })
    }

    const { error } = await supabase
      .from('pending_payments')
      .update({ status: 'paid', razorpay_payment_id: paymentId })
      .eq('order_id', referenceId)

    if (error) {
      console.error('DB update failed:', error)
      return new Response('DB error', { status: 500 })
    }
    // DB trigger handle_payment_confirmed() fires here → creates registrations row
    console.log(`✓ qr_code.credited confirmed: order=${referenceId}`)
    return new Response('OK', { status: 200 })
  }

  // ── 3. Handle payment.captured / payment.authorized (order-based) ────────
  if (event === 'payment.captured' || event === 'payment.authorized') {
    const pld       = payload.payload as Record<string, unknown>
    const payEntity = (pld?.payment as Record<string, unknown>)?.entity as Record<string, unknown>
    const orderId   = payEntity?.order_id as string
    const paymentId = payEntity?.id as string

    if (!orderId) {
      return new Response('No order_id in payload', { status: 400 })
    }

    const { data: existing } = await supabase
      .from('pending_payments')
      .select('status')
      .eq('order_id', orderId)
      .single()

    if (!existing) return new Response('Order not found', { status: 200 })
    if (existing.status !== 'pending') return new Response('Already processed', { status: 200 })

    const { error } = await supabase
      .from('pending_payments')
      .update({ status: 'paid', razorpay_payment_id: paymentId })
      .eq('order_id', orderId)

    if (error) { console.error('DB update failed:', error); return new Response('DB error', { status: 500 }) }
    console.log(`✓ payment.captured: order=${orderId}`)
    return new Response('OK', { status: 200 })
  }

  // ── 4. Handle payment.failed ──────────────────────────────────────────────
  if (event === 'payment.failed') {
    const pld       = payload.payload as Record<string, unknown>
    const payEntity = (pld?.payment as Record<string, unknown>)?.entity as Record<string, unknown>
    const orderId   = payEntity?.order_id as string
    if (orderId) {
      await supabase.from('pending_payments').update({ status: 'failed' }).eq('order_id', orderId)
      console.log(`✗ payment.failed: order=${orderId}`)
    }
    return new Response('OK', { status: 200 })
  }

  // Acknowledge all other events
  return new Response('OK', { status: 200 })
})
