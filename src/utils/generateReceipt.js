/**
 * src/utils/generateReceipt.js
 *
 * Pixel-perfect Payment Receipt Generator for E-Fest '26 (Success Squad).
 * Uses EFEST RECEIPT-SP.pdf as the exact design reference:
 *  - Outer crisp solid border
 *  - Top split header: Success Squad Logo (left) | E-Fest Logo (right)
 *  - Title box: PAYMENT RECEIPT / ENROLLMENT CONFIRMATION
 *  - Meta row: RECEIPT NO. : <val> | DATE : <val> | PAYMENT STATUS : PAID badge
 *  - Body details (8 exact items):
 *      TEAM NAME :
 *      TEAM LEADER :
 *      REGISTRATION ID :
 *      EVENT NAME :
 *      APPLICABLE FEES :
 *      TOTAL PAID AMOUNT :
 *      TRANSACTION ID:
 *      PAYMENT METHOD:
 *  - Footer: THANKYOU FOR REGISTERING !!
 *
 * STRICT GATEWAY VERIFICATION RULE:
 *  - Generate receipts only after payment is verified by the payment gateway.
 *  - NEVER mark failed or pending payments as PAID.
 */

import { SUCCESS_SQUAD_LOGO, EFEST_LOGO } from '../assets/receiptLogos.js'

async function loadLibs() {
  const [html2canvasMod, jsPDFMod] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])
  const html2canvas = html2canvasMod.default || html2canvasMod
  const jsPDF = jsPDFMod.jsPDF || jsPDFMod.default?.jsPDF || jsPDFMod.default
  return { html2canvas, jsPDF }
}

const EVENT_NAMES = {
  'bgmi-lec':      'BGMI LEC — Esports Championship',
  'fflec':         'Free Fire Max (FFLEC) Tournament',
  'craftcode':     'CraftCode — National Hackathon',
  'ipl-auction':   'IPL Mega Auction Simulation',
  'startup-pitch': 'Startup Pitch Battle (Shark Tank)',
  'money-makers':  'Money Makers — Trading & Finance',
}

export function resolveEventName(eventId) {
  return EVENT_NAMES[eventId] ?? (eventId ? String(eventId).toUpperCase() : 'E-Fest 2026 Event')
}

export function formatReceiptDate(iso) {
  if (!iso) {
    const now = new Date()
    const d = String(now.getDate()).padStart(2, '0')
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const y = now.getFullYear()
    return `${d}/${m}/${y}`
  }
  try {
    const dObj = new Date(iso)
    if (isNaN(dObj.getTime())) return String(iso)
    const d = String(dObj.getDate()).padStart(2, '0')
    const m = String(dObj.getMonth() + 1).padStart(2, '0')
    const y = dObj.getFullYear()
    return `${d}/${m}/${y}`
  } catch {
    return String(iso)
  }
}

/**
 * Normalizes registration & payment data for the receipt.
 */
export function extractReceiptData(reg) {
  if (!reg) throw new Error('No registration record provided.')

  const statusRaw = (reg.status || reg.payment_status || '').toLowerCase()
  const isVerified = statusRaw === 'verified' || statusRaw === 'confirmed' || statusRaw === 'paid'

  // STRICT ENFORCEMENT: Never generate a PAID receipt for unverified or pending transactions
  if (!isVerified) {
    throw new Error(
      `Payment is not verified (status: ${reg.status || 'pending'}). Official PAID receipts can only be generated after payment is verified by the payment gateway.`
    )
  }

  const teamData = reg.team_data || {}
  const teamName = teamData.teamName || reg.team_name || '—'
  const leaderName = teamData.leaderName || reg.leader_name || '—'

  // Registration ID: team_id, registration_id, or order_id
  const registrationId = reg.team_id || reg.registration_id || reg.order_id || 'REG-PENDING'

  // Receipt Number: generated or stored
  const receiptNumber = reg.receipt_number || reg.receipt_no || (
    'EF26-REC-' + (reg.order_id ? reg.order_id.replace(/^ORD_/, '') : Math.floor(100000 + Math.random() * 900000))
  )

  const eventName = resolveEventName(reg.event_id || reg.eventId)
  const feeAmount = reg.amount_inr ?? reg.amount ?? reg.entryFee ?? 199
  const applicableFees = `₹${feeAmount}`
  const totalPaidAmount = `₹${feeAmount}`

  const transactionId = reg.utr || reg.transaction_id || reg.transactionId || reg.order_id || '—'
  const paymentMethod = reg.payment_method || reg.paymentMethod || 'UPI / Online Payment Gateway'
  const dateString = formatReceiptDate(reg.verified_at || reg.created_at)

  return {
    receiptNumber,
    dateString,
    paymentStatus: 'PAID',
    teamName,
    leaderName,
    registrationId,
    eventName,
    applicableFees,
    totalPaidAmount,
    transactionId,
    paymentMethod,
    isVerified: true,
  }
}

/**
 * Generates exact HTML string adhering to EFEST RECEIPT-SP.pdf layout.
 */
export function buildReceiptHTML(fields) {
  const {
    receiptNumber,
    dateString,
    teamName,
    leaderName,
    registrationId,
    eventName,
    applicableFees,
    totalPaidAmount,
    transactionId,
    paymentMethod,
  } = fields

  return `
    <div id="__efest_receipt_container__" style="
      width: 620px;
      min-height: 940px;
      background: #ffffff;
      color: #000000;
      font-family: Arial, Helvetica, sans-serif;
      border: 3px solid #000000;
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      position: relative;
    ">
      <!-- ── TOP HEADER (Two columns split down the middle) ── -->
      <div style="
        display: flex;
        flex-direction: row;
        width: 100%;
        height: 140px;
        border-bottom: 2px solid #000000;
        box-sizing: border-box;
      ">
        <!-- Left: Success Squad Logo -->
        <div style="
          width: 50%;
          height: 100%;
          border-right: 2px solid #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          box-sizing: border-box;
        ">
          <img
            src="${SUCCESS_SQUAD_LOGO}"
            alt="SUCCESS SQUAD Logo"
            style="max-height: 95px; max-width: 90%; object-fit: contain; display: block;"
          />
        </div>

        <!-- Right: E-Fest Logo -->
        <div style="
          width: 50%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          box-sizing: border-box;
        ">
          <img
            src="${EFEST_LOGO}"
            alt="E-FEST Logo"
            style="max-height: 105px; max-width: 90%; object-fit: contain; display: block;"
          />
        </div>
      </div>

      <!-- ── TITLE BOX ── -->
      <div style="
        width: 100%;
        padding: 18px 20px 14px;
        text-align: center;
        border-bottom: 2px solid #000000;
        box-sizing: border-box;
      ">
        <h1 style="
          margin: 0;
          font-size: 28px;
          font-weight: 900;
          letter-spacing: 1.5px;
          color: #000000;
          text-transform: uppercase;
          line-height: 1.2;
        ">
          PAYMENT RECEIPT
        </h1>
        <div style="
          margin-top: 6px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #111111;
          text-transform: uppercase;
          line-height: 1.2;
        ">
          ENROLLMENT CONFIRMATION
        </div>
      </div>

      <!-- ── METADATA ROW ── -->
      <div style="
        width: 100%;
        padding: 12px 24px;
        border-bottom: 2px solid #000000;
        box-sizing: border-box;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <!-- Receipt No -->
        <div style="font-size: 13px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 0.5px;">
          RECEIPT NO. : <span style="font-weight: 800; color: #111111; margin-left: 4px;">${receiptNumber}</span>
        </div>

        <!-- Date -->
        <div style="font-size: 13px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 0.5px;">
          DATE : <span style="font-weight: 800; color: #111111; margin-left: 4px;">${dateString}</span>
        </div>

        <!-- Payment Status with Green Badge -->
        <div style="
          font-size: 13px;
          font-weight: 900;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
        ">
          PAYMENT STATUS :
          <span style="
            margin-left: 8px;
            background-color: #5cb85c;
            color: #000000;
            font-weight: 900;
            padding: 3px 12px;
            border-radius: 4px;
            font-size: 13px;
            letter-spacing: 1px;
            display: inline-block;
          ">
            PAID
          </span>
        </div>
      </div>

      <!-- ── BODY DETAILS (Exact 8 items from uploaded reference) ── -->
      <div style="
        flex: 1;
        padding: 42px 48px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        min-height: 520px;
      ">
        <!-- 1. TEAM NAME -->
        <div style="display: flex; align-items: baseline; margin-bottom: 22px;">
          <div style="width: 220px; flex-shrink: 0; font-size: 14px; font-weight: 900; color: #000000; letter-spacing: 0.5px;">
            TEAM NAME :
          </div>
          <div style="flex: 1; font-size: 15px; font-weight: 800; color: #111111; text-transform: uppercase; word-break: break-word;">
            ${teamName}
          </div>
        </div>

        <!-- 2. TEAM LEADER -->
        <div style="display: flex; align-items: baseline; margin-bottom: 22px;">
          <div style="width: 220px; flex-shrink: 0; font-size: 14px; font-weight: 900; color: #000000; letter-spacing: 0.5px;">
            TEAM LEADER :
          </div>
          <div style="flex: 1; font-size: 15px; font-weight: 800; color: #111111; text-transform: uppercase; word-break: break-word;">
            ${leaderName}
          </div>
        </div>

        <!-- 3. REGISTRATION ID -->
        <div style="display: flex; align-items: baseline; margin-bottom: 22px;">
          <div style="width: 220px; flex-shrink: 0; font-size: 14px; font-weight: 900; color: #000000; letter-spacing: 0.5px;">
            REGISTRATION ID :
          </div>
          <div style="flex: 1; font-size: 15px; font-weight: 800; color: #111111; text-transform: uppercase; word-break: break-word;">
            ${registrationId}
          </div>
        </div>

        <!-- 4. EVENT NAME -->
        <div style="display: flex; align-items: baseline; margin-bottom: 22px;">
          <div style="width: 220px; flex-shrink: 0; font-size: 14px; font-weight: 900; color: #000000; letter-spacing: 0.5px;">
            EVENT NAME :
          </div>
          <div style="flex: 1; font-size: 15px; font-weight: 800; color: #111111; text-transform: uppercase; word-break: break-word;">
            ${eventName}
          </div>
        </div>

        <!-- 5. APPLICABLE FEES -->
        <div style="display: flex; align-items: baseline; margin-bottom: 22px;">
          <div style="width: 220px; flex-shrink: 0; font-size: 14px; font-weight: 900; color: #000000; letter-spacing: 0.5px;">
            APPLICABLE FEES :
          </div>
          <div style="flex: 1; font-size: 15px; font-weight: 800; color: #111111; text-transform: uppercase;">
            ${applicableFees}
          </div>
        </div>

        <!-- 6. TOTAL PAID AMOUNT -->
        <div style="display: flex; align-items: baseline; margin-bottom: 22px;">
          <div style="width: 220px; flex-shrink: 0; font-size: 14px; font-weight: 900; color: #000000; letter-spacing: 0.5px;">
            TOTAL PAID AMOUNT :
          </div>
          <div style="flex: 1; font-size: 15px; font-weight: 800; color: #111111; text-transform: uppercase;">
            ${totalPaidAmount}
          </div>
        </div>

        <!-- 7. TRANSACTION ID -->
        <div style="display: flex; align-items: baseline; margin-bottom: 22px;">
          <div style="width: 220px; flex-shrink: 0; font-size: 14px; font-weight: 900; color: #000000; letter-spacing: 0.5px;">
            TRANSACTION ID:
          </div>
          <div style="flex: 1; font-size: 15px; font-weight: 800; color: #111111; text-transform: uppercase; word-break: break-all;">
            ${transactionId}
          </div>
        </div>

        <!-- 8. PAYMENT METHOD -->
        <div style="display: flex; align-items: baseline; margin-bottom: 10px;">
          <div style="width: 220px; flex-shrink: 0; font-size: 14px; font-weight: 900; color: #000000; letter-spacing: 0.5px;">
            PAYMENT METHOD:
          </div>
          <div style="flex: 1; font-size: 15px; font-weight: 800; color: #111111; text-transform: uppercase;">
            ${paymentMethod}
          </div>
        </div>
      </div>

      <!-- ── FOOTER BOX ── -->
      <div style="
        width: 100%;
        padding: 18px 20px;
        text-align: center;
        border-top: 2px solid #000000;
        box-sizing: border-box;
      ">
        <h2 style="
          margin: 0;
          font-size: 19px;
          font-weight: 900;
          letter-spacing: 2px;
          color: #000000;
          text-transform: uppercase;
          line-height: 1.2;
        ">
          THANKYOU FOR REGISTERING !!
        </h2>
      </div>
    </div>
  `
}

/**
 * Downloads the Receipt PDF.
 * @param {Object} reg - registration or verified order record
 * @param {Object} options - { download = true, filename }
 */
export async function generateReceipt(reg, options = {}) {
  const fields = extractReceiptData(reg)
  const { html2canvas, jsPDF } = await loadLibs()

  // Mount temporary receipt DOM node offscreen
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;background:#ffffff;'
  container.innerHTML = buildReceiptHTML(fields)
  document.body.appendChild(container)

  const receiptEl = container.querySelector('#__efest_receipt_container__')

  try {
    const canvas = await html2canvas(receiptEl, {
      scale: 2.5, // High DPI crystal-crisp render
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width / 2.5, canvas.height / 2.5],
    })

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2.5, canvas.height / 2.5)

    const finalFilename = options.filename || `Receipt-${fields.registrationId || fields.receiptNumber}.pdf`

    if (options.download !== false) {
      pdf.save(finalFilename)
    }

    return {
      pdf,
      filename: finalFilename,
      blobUrl: pdf.output('bloburl'),
      dataUrl: imgData,
    }
  } finally {
    document.body.removeChild(container)
  }
}

/**
 * Native Print Receipt handler.
 * Renders the exact receipt in an isolated printable iframe so the user's browser print dialog opens seamlessly.
 * @param {Object} reg - verified registration record
 */
export async function printReceipt(reg) {
  const fields = extractReceiptData(reg)
  const receiptHTML = buildReceiptHTML(fields)

  const iframe = document.createElement('iframe')
  // Position offscreen with real dimensions so the browser completely computes styling and layout
  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:750px;height:1100px;border:none;background:#ffffff;z-index:-1;'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow.document
  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Receipt - ${fields.registrationId || fields.receiptNumber}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            display: flex;
            justify-content: center;
            align-items: flex-start;
          }
          #__efest_receipt_container__ {
            margin: 0 auto !important;
            max-width: 100% !important;
          }
        </style>
      </head>
      <body>
        ${receiptHTML}
      </body>
    </html>
  `)
  doc.close()

  // Wait for DOM and base64 images inside iframe to be ready before calling print
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
        resolve(true)
      } catch (e) {
        console.warn('Iframe print error, falling back to window.print():', e)
        try {
          window.print()
        } catch {}
        resolve(false)
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
        }, 4000)
      }
    }, 350)
  })
}

