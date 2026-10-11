import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { team_id, verification_val } = await req.json()
    if (!team_id || !verification_val) {
      return new Response(JSON.stringify({ error: 'Missing team_id or verification_val' }), { status: 400, headers: corsHeaders })
    }

    const { data: reg, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('team_id', team_id)
      .single()

    if (error || !reg) {
      return new Response(JSON.stringify({ error: 'Registration not found' }), { status: 404, headers: corsHeaders })
    }

    if (reg.status !== 'verified') {
      return new Response(JSON.stringify({ error: 'Receipt not available until verified' }), { status: 403, headers: corsHeaders })
    }

    if (!reg.receipt_path) {
      return new Response(JSON.stringify({ error: 'Receipt not generated yet' }), { status: 404, headers: corsHeaders })
    }

    // Verify ownership
    // leader email or last 4 digits of leader phone
    const leaderEmail = reg.team_data?.leaderEmail?.toLowerCase()
    const leaderPhone = reg.team_data?.leaderPhone?.replace(/\D/g, '') || ''
    const phoneLast4 = leaderPhone.slice(-4)
    
    // Check if requester is an admin
    const authHeader = req.headers.get('Authorization')
    let isAdmin = false
    if (authHeader) {
      const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
      // You can define a list of admin emails here or check a claims table
      if (user && user.email && (user.email === 'admin@success-squad.com' || user.email.includes('admin'))) {
        isAdmin = true
      }
    }

    const val = verification_val?.trim().toLowerCase()
    const isAuthorized = isAdmin || (leaderEmail && val === leaderEmail) || (phoneLast4 && val === phoneLast4)

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Verification failed' }), { status: 403, headers: corsHeaders })
    }

    const { data: urlData, error: urlError } = await supabase.storage
      .from('receipts')
      .createSignedUrl(reg.receipt_path, 60, {
        download: `SuccessSquad-Receipt-${team_id}.pdf`
      })

    if (urlError || !urlData) {
      return new Response(JSON.stringify({ error: 'Failed to generate download URL' }), { status: 500, headers: corsHeaders })
    }

    // Mark as downloaded
    await supabase.from('registrations').update({ receipt_downloaded_at: new Date().toISOString() }).eq('id', reg.id)

    return new Response(JSON.stringify({ url: urlData.signedUrl }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }
})
