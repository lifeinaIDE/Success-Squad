// supabase/functions/expire-order/index.ts
// Called by the client when the countdown hits 0:00 (idempotent).
// The pg_cron sweep in 001_init.sql handles server-side sweeping every minute,
// so this function is the manual "fast path" triggered by the client.
//
// Does NOT require any secrets — uses service_role (auto-injected).

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId } = await req.json()

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Missing orderId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Fetch current status
    const { data, error: fetchErr } = await supabase
      .from('pending_payments')
      .select('status')
      .eq('order_id', orderId)
      .single()

    if (fetchErr || !data) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Idempotent — don't overwrite paid/failed/expired
    if (data.status !== 'pending') {
      return new Response(
        JSON.stringify({ success: true, status: data.status }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error: updateErr } = await supabase
      .from('pending_payments')
      .update({ status: 'expired' })
      .eq('order_id', orderId)
      .eq('status', 'pending')  // extra guard against race condition

    if (updateErr) {
      console.error('Failed to expire order:', updateErr)
      return new Response(
        JSON.stringify({ error: 'DB update failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, status: 'expired' }),
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
