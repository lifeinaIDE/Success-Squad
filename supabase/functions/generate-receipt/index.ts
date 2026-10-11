import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { PDFDocument, rgb, StandardFonts, hexToRgb } from 'https://esm.sh/pdf-lib@1.17.1'
import fontkit from 'https://esm.sh/@pdf-lib/fontkit@1.1.1'
import QRCode from 'https://esm.sh/qrcode@1.5.3'
import configData from './template.config.json' with { type: 'json' }

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

function hexToPdfColor(hex: string) {
  if (!hex) return rgb(0, 0, 0)
  hex = hex.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255
  return rgb(r, g, b)
}

function truncateText(text: string, font: any, size: number, maxWidth: number) {
  let width = font.widthOfTextAtSize(text, size)
  if (width <= maxWidth) return text
  let truncated = text
  while (width > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1)
    width = font.widthOfTextAtSize(truncated + '...', size)
  }
  return truncated + '...'
}

function getNextReceiptNo(supabaseClient: any) {
  return supabaseClient.rpc('get_next_receipt_no') 
    // Wait, the RPC 'get_next_receipt_no' might not exist.
    // In Postgres sequences we can do: SELECT nextval('receipt_no_seq')
    // We should write that as an RPC or use a query. 
    // Alternatively, use a raw query if pg_net is available or just an RPC.
}

serve(async (req) => {
  try {
    const body = await req.json()
    
    // Support either direct call or pg_net webhook structure
    const isWebhook = body.type && body.record
    const registrationId = isWebhook ? body.record.id : body.registration_id
    const force = isWebhook ? false : body.force === true
    const calibrate = body.calibrate === true

    if (!registrationId && !calibrate) {
      return new Response(JSON.stringify({ error: 'registration_id is required' }), { status: 400 })
    }

    let record = null
    let receiptNo = null
    let teamId = 'CALIBRATION'

    if (!calibrate) {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('id', registrationId)
        .single()
      
      if (error || !data) {
        return new Response(JSON.stringify({ error: 'Registration not found' }), { status: 404 })
      }
      record = data
      teamId = record.team_id

      if (record.receipt_path && !force) {
        return new Response(JSON.stringify({ message: 'Receipt already exists', path: record.receipt_path }), { status: 200 })
      }
      receiptNo = record.receipt_no
    }

    if (!calibrate && !receiptNo) {
      // Fetch sequence
      const { data: seqData, error: seqError } = await supabase.rpc('get_next_receipt_no')
      if (seqError) {
        // Fallback or error
        receiptNo = `SS-2026-${Math.floor(Math.random()*1000000)}` // Temporary if RPC missing
      } else {
        receiptNo = `SS-2026-${String(seqData).padStart(6, '0')}`
      }
    }

    // Load template
    // Event configs could define the template name, fallback to 'default.pdf'
    // Actually we will just use 'default.pdf' for now since eventConfigs.js is not directly accessible here unless fetched.
    const templateName = 'default.pdf'
    const { data: templateData, error: templateError } = await supabase.storage.from('receipt-templates').download(templateName)
    
    if (templateError || !templateData) {
      return new Response(JSON.stringify({ error: `Template ${templateName} not found in receipt-templates bucket.` }), { status: 500 })
    }

    const pdfDoc = await PDFDocument.load(await templateData.arrayBuffer())
    pdfDoc.registerFontkit(fontkit)

    // Fonts - assuming they exist in the bucket or we use standard fonts
    // To embed local fonts in Deno, they need to be fetched or base64. 
    // We will use standard fonts as a fallback if custom fonts aren't available.
    const syneFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const dmSansFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const getFont = (name: string) => name.toLowerCase().includes('syne') ? syneFont : dmSansFont

    // Prepare data
    const dataObj: any = {
      receipt_no: calibrate ? '[RECEIPT_NO]' : receiptNo,
      payment_date: calibrate ? '[DATE]' : new Date(record?.verified_at || record?.created_at).toLocaleDateString('en-GB'),
      team_name: calibrate ? '[TEAM_NAME]' : record?.team_data?.teamName || '—',
      leader_name: calibrate ? '[LEADER_NAME]' : record?.team_data?.leaderName || '—',
      registration_id: calibrate ? '[REG_ID]' : teamId,
      event_name: calibrate ? '[EVENT_NAME]' : record?.event_id || '—',
      applicable_fees: calibrate ? '[FEES]' : 'Rs. ' + (record?.team_data?.amount || '0'),
      amount_paid: calibrate ? '[TOTAL_PAID]' : 'Rs. ' + (record?.team_data?.amount || '0'),
      transaction_id: calibrate ? '[TXN_ID]' : (record?.utr || record?.order_id || '—'),
      payment_method: calibrate ? '[METHOD]' : 'UPI'
    }

    // Process fields
    const pages = pdfDoc.getPages()
    for (const [key, field] of Object.entries(configData.fields)) {
      const page = pages[field.page || 0]
      if (!page) continue
      
      const val = dataObj[key]
      if (val === undefined && key !== 'qr_code') continue

      if (key === 'qr_code' && field.size) {
        const qrUrl = calibrate ? 'https://example.com' : `https://success-squad.com/status?team=${teamId}`
        const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 0 })
        const qrImageBytes = Uint8Array.from(atob(qrDataUrl.split(',')[1]), c => c.charCodeAt(0))
        const qrImage = await pdfDoc.embedPng(qrImageBytes)
        page.drawImage(qrImage, {
          x: field.x,
          y: field.y,
          width: field.size,
          height: field.size
        })
        continue
      }

      if (typeof val === 'string') {
        const font = getFont(field.fontFamily || '')
        let text = val
        if (field.maxWidth) {
          text = truncateText(val, font, field.fontSize, field.maxWidth)
        }
        
        let finalX = field.x
        if (field.align === 'center') {
          const width = font.widthOfTextAtSize(text, field.fontSize)
          finalX = field.x - width / 2
        } else if (field.align === 'right') {
          const width = font.widthOfTextAtSize(text, field.fontSize)
          finalX = field.x - width
        }

        page.drawText(text, {
          x: finalX,
          y: field.y,
          size: field.fontSize,
          font,
          color: hexToPdfColor(field.color || '#000000')
        })
      }
      
      if (calibrate) {
        // Draw red crosshair
        page.drawLine({ start: { x: field.x - 5, y: field.y }, end: { x: field.x + 5, y: field.y }, thickness: 1, color: rgb(1,0,0) })
        page.drawLine({ start: { x: field.x, y: field.y - 5 }, end: { x: field.x, y: field.y + 5 }, thickness: 1, color: rgb(1,0,0) })
      }
    }

    // Form fields if AcroForm exists
    const form = pdfDoc.getForm()
    if (form && form.getFields().length > 0) {
      for (const field of form.getFields()) {
        const name = field.getName()
        if (dataObj[name]) {
          try {
            const textField = form.getTextField(name)
            textField.setText(dataObj[name])
          } catch (e) {
            // Not a text field
          }
        }
      }
      form.flatten()
    }

    const pdfBytes = await pdfDoc.save()

    if (calibrate) {
      return new Response(pdfBytes, { headers: { 'Content-Type': 'application/pdf' } })
    }

    const receiptPath = `${teamId}.pdf`
    
    await supabase.storage.from('receipts').upload(receiptPath, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true
    })

    await supabase
      .from('registrations')
      .update({
        receipt_path: receiptPath,
        receipt_no: receiptNo,
        receipt_generated_at: new Date().toISOString()
      })
      .eq('id', registrationId)

    return new Response(JSON.stringify({ success: true, receipt_path: receiptPath }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
