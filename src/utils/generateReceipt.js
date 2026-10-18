/**
 * src/utils/generateReceipt.js
 *
 * Generates a downloadable PDF receipt matching the official E-Fest '26 template.
 * Uses html2canvas + jsPDF (client-side, no server round-trip).
 */

import { SUCCESS_SQUAD_LOGO_BASE64, EFEST_LOGO_BASE64 } from './receiptLogos.js'

// ── Lazy-load heavy PDF libs only when receipt is actually requested ─────────
async function loadLibs() {
  const [html2canvas, { jsPDF }] = await Promise.all([
    import('html2canvas').then((m) => m.default),
    import('jspdf'),
  ])
  return { html2canvas, jsPDF }
}

// ── Event ID → display name lookup ───────────────────────────────────────────
const EVENT_NAMES = {
  'bgmi-lec':      'BGMI LEC',
  'fflec':         'FFLEC',
  'craftcode':     'CraftCode',
  'ipl-auction':   'IPL Auction',
  'startup-pitch': 'Startup Pitch Battle',
  'money-makers':  'Illuminate Workshop',
}

function resolveEventName(eventId) {
  return EVENT_NAMES[eventId] ?? eventId ?? '-'
}

function formatDate(iso) {
  if (!iso) return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  } catch {
    return iso
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// OFFICIAL TEMPLATE LAYOUT (Matches E-Fest '26 Payment Receipt)
// ══════════════════════════════════════════════════════════════════════════════
function buildReceiptHTML(fields) {
  const {
    receiptNo,
    date,
    paymentStatus,
    teamName,
    leaderName,
    registrationId,
    eventName,
    applicableFees,
    totalPaid,
    transactionId,
    paymentMethod,
  } = fields

  return `
    <div id="__receipt_root__" style="
      width: 595px;
      height: 842px;
      background: #ffffff;
      color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      box-sizing: border-box;
      border: 2.5px solid #000000;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    ">
      <!-- Header Row: Logos -->
      <div style="
        display: flex;
        height: 140px;
        border-bottom: 2.5px solid #000000;
      ">
        <!-- Left Logo: Success Squad -->
        <div style="
          width: 38%;
          border-right: 2.5px solid #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          background: #ffffff;
        ">
          <img src="${SUCCESS_SQUAD_LOGO_BASE64}" alt="Success Squad" style="max-height: 110px; max-width: 90%; object-fit: contain;" />
        </div>

        <!-- Right Logo: E-Fest -->
        <div style="
          width: 62%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          background: #ffffff;
        ">
          <img src="${EFEST_LOGO_BASE64}" alt="E-Fest" style="max-height: 115px; max-width: 90%; object-fit: contain;" />
        </div>
      </div>

      <!-- Title Header -->
      <div style="
        padding: 16px 20px;
        text-align: center;
        border-bottom: 2.5px solid #000000;
        background: #ffffff;
      ">
        <h1 style="
          margin: 0;
          font-size: 26px;
          font-weight: 900;
          letter-spacing: 1.5px;
          color: #000000;
          line-height: 1.2;
        ">PAYMENT RECEIPT</h1>
        <div style="
          margin-top: 5px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #333333;
        ">ENROLLMENT CONFIRMATION</div>
      </div>

      <!-- Metadata Strip -->
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 24px;
        border-bottom: 2.5px solid #000000;
        font-size: 13.5px;
        font-weight: 800;
        color: #000000;
        background: #ffffff;
      ">
        <div>
          RECEIPT NO. : <span style="font-weight: 600; margin-left: 4px;">${receiptNo}</span>
        </div>
        <div>
          DATE : <span style="font-weight: 600; margin-left: 4px;">${date}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>PAYMENT STATUS :</span>
          <span style="
            background: #22c55e;
            color: #000000;
            font-weight: 900;
            font-size: 12px;
            padding: 3px 12px;
            border-radius: 6px;
            letter-spacing: 1px;
          ">${paymentStatus}</span>
        </div>
      </div>

      <!-- Details Section -->
      <div style="
        padding: 36px 48px;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        background: #ffffff;
      ">
        ${[
          ['TEAM NAME',          teamName],
          ['TEAM LEADER',        leaderName],
          ['REGISTRATION ID',    registrationId],
          ['EVENT NAME',         eventName],
          ['APPLICABLE FEES',    applicableFees],
          ['TOTAL PAID AMOUNT',  totalPaid],
          ['TRANSACTION ID',     transactionId],
          ['PAYMENT METHOD',     paymentMethod],
        ].map(([label, value]) => `
          <div style="display: flex; align-items: flex-start; font-size: 15px; line-height: 1.4;">
            <div style="width: 220px; font-weight: 900; color: #000000; letter-spacing: 0.5px; flex-shrink: 0;">
              ${label} :
            </div>
            <div style="font-weight: 600; color: #111111; word-break: break-all; flex-grow: 1;">
              ${value ?? '-'}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Footer Section -->
      <div style="
        border-top: 2.5px solid #000000;
        padding: 18px 20px;
        text-align: center;
        font-size: 19px;
        font-weight: 900;
        letter-spacing: 2.5px;
        color: #000000;
        background: #ffffff;
      ">
        THANKYOU FOR REGISTERING !!
      </div>
    </div>
  `
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function generateReceipt(reg) {
  const isIndividual = reg.event_id === 'money-makers' || reg.registrationType === 'individual'
  const teamName = isIndividual
    ? (reg.team_data?.leaderName ?? reg.team_data?.name ?? '-')
    : (reg.team_data?.teamName ?? reg.team_data?.leaderName ?? '-')
  const leaderName = reg.team_data?.leaderName ?? reg.team_data?.name ?? '-'
  
  const registrationId = reg.team_id || reg.order_id || 'PENDING'
  const receiptNo = reg.order_id || reg.team_id || `REC-${Date.now().toString().slice(-6)}`
  const eventName = resolveEventName(reg.event_id)
  const amount = reg.amount_inr ? `₹${reg.amount_inr}` : '-'
  const date = formatDate(reg.verified_at || reg.created_at)
  const status = (reg.status === 'confirmed' || reg.status === 'verified' || reg.status === 'submitted')
    ? 'PAID'
    : (reg.status ? reg.status.toUpperCase() : 'PAID')

  const fields = {
    receiptNo,
    date,
    paymentStatus: status,
    teamName,
    leaderName,
    registrationId,
    eventName,
    applicableFees: amount,
    totalPaid: amount,
    transactionId: reg.utr ?? '-',
    paymentMethod: 'UPI (Online)',
  }

  const { html2canvas, jsPDF } = await loadLibs()

  // Mount the receipt DOM node off-screen
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;'
  container.innerHTML = buildReceiptHTML(fields)
  document.body.appendChild(container)

  const receiptEl = container.querySelector('#__receipt_root__')

  try {
    const canvas = await html2canvas(receiptEl, {
      scale: 2,          // 2× for high resolution print
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width / 2, canvas.height / 2],
    })
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
    pdf.save(`receipt-${registrationId}.pdf`)
  } finally {
    document.body.removeChild(container)
  }
}
