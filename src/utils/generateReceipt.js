/**
 * src/utils/generateReceipt.js
 *
 * Generates a downloadable PDF receipt for a verified E-Fest registration.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * HOW TO SWAP IN THE REAL TEMPLATE
 * ══════════════════════════════════════════════════════════════════════════
 * This file uses html2canvas + jsPDF (client-side, no server round-trip).
 * The layout is defined in the buildReceiptHTML() function below.
 *
 * When you receive the final design template:
 *   - If it's a PNG/JPG/Figma export  → update buildReceiptHTML() to match
 *     the exact layout, fonts, colors, and positioning. The data injection
 *     (team_id, team_name, etc.) stays in the same FIELD_MAP object.
 *   - If it's a fillable PDF          → replace this entire file with a
 *     pdf-lib implementation that injects FIELD_MAP values into the PDF's
 *     AcroForm fields. The function signature stays identical.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * DEPENDENCIES  (install once):
 *   npm install html2canvas jspdf
 * ══════════════════════════════════════════════════════════════════════════
 *
 * @param {Object} reg - registration record from Supabase
 * @param {string} reg.team_id - e.g. "BGMI-00001" or "CRAFT-00001"
 * @param {string} reg.event_id - event slug, used to resolve display name
 * @param {Object} reg.team_data - jsonb: { teamName, leaderName, leaderEmail, ... }
 * @param {number} reg.amount_inr - amount paid in ₹
 * @param {string} reg.utr - UPI transaction reference (from pending_payments)
 * @param {string} reg.verified_at - ISO timestamp of admin verification
 *
 * @returns {Promise<void>} - triggers browser download of "receipt-<team_id>.pdf"
 */

// ── Lazy-load heavy PDF libs only when receipt is actually requested ─────────
async function loadLibs() {
  const [html2canvas, { jsPDF }] = await Promise.all([
    import('html2canvas').then((m) => m.default),
    import('jspdf'),
  ])
  return { html2canvas, jsPDF }
}

// ── Event ID → display name lookup (mirrors eventConfigs.js) ─────────────────
const EVENT_NAMES = {
  'bgmi-lec':      'BGMI LEC',
  'fflec':         'FFLEC',
  'craftcode':     'CraftCode',
  'ipl-auction':   'IPL Auction',
  'startup-pitch': 'Startup Pitch Battle',
  'money-makers':  'Money Makers',
}

function resolveEventName(eventId) {
  return EVENT_NAMES[eventId] ?? eventId
}

function formatVerifiedDate(iso) {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric'
    })
  } catch {
    return iso
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// PLACEHOLDER LAYOUT
// Replace everything inside this function when the real design template arrives.
// Only the data binding (FIELD_MAP usage) must be preserved.
// ══════════════════════════════════════════════════════════════════════════════
function buildReceiptHTML(fields) {
  const {
    teamId,
    teamName,
    leaderName,
    eventName,
    amountINR,
    transactionId,
    verifiedDate,
  } = fields

  return `
    <div id="__receipt_root__" style="
      width: 595px;
      min-height: 842px;
      background: #0f0f1a;
      font-family: 'Inter', 'Segoe UI', sans-serif;
      color: #fff;
      padding: 48px 56px;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
    ">
      <!-- Decorative accent blob -->
      <div style="
        position: absolute; top: -80px; right: -80px;
        width: 280px; height: 280px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%);
        pointer-events: none;
      "></div>

      <!-- Header -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px;">
        <div>
          <div style="font-size:11px; letter-spacing:3px; text-transform:uppercase; color:#6366f1; margin-bottom:6px;">
            Success Squad · E-Fest '26
          </div>
          <h1 style="margin:0; font-size:28px; font-weight:800; letter-spacing:-0.5px;">
            Registration Receipt
          </h1>
        </div>
        <div style="
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.4);
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 12px;
          color: #a5b4fc;
          font-weight: 600;
        ">VERIFIED ✓</div>
      </div>

      <!-- Team ID badge -->
      <div style="
        background: rgba(99,102,241,0.1);
        border: 1px solid rgba(99,102,241,0.35);
        border-radius: 12px;
        padding: 20px 24px;
        margin-bottom: 32px;
      ">
        <div style="font-size:10px; text-transform:uppercase; letter-spacing:2px; color:#8b8ea8; margin-bottom:6px;">Team ID</div>
        <div style="font-size:28px; font-weight:800; letter-spacing:2px; color:#6366f1;">${teamId}</div>
      </div>

      <!-- Details grid -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:32px;">
        ${[
          ['Event',          eventName],
          ['Team Name',      teamName],
          ['Leader',         leaderName],
          ['Amount Paid',    `₹${amountINR}`],
          ['Verified On',    verifiedDate],
          ['Transaction ID', transactionId],
        ].map(([label, value]) => `
          <div style="background:rgba(255,255,255,0.04); border-radius:8px; padding:14px 16px;">
            <div style="font-size:10px; text-transform:uppercase; letter-spacing:1.5px; color:#8b8ea8; margin-bottom:4px;">${label}</div>
            <div style="font-size:14px; font-weight:600; word-break:break-all;">${value ?? '-'}</div>
          </div>
        `).join('')}
      </div>

      <!-- Divider -->
      <div style="border-top:1px solid rgba(255,255,255,0.08); margin:32px 0;"></div>

      <!-- Footer note -->
      <p style="font-size:11px; color:#6b7280; line-height:1.6; text-align:center;">
        This receipt confirms your registration for E-Fest '26 hosted by Success Squad.<br/>
        Show this at the event venue for entry. Team ID is your official identifier.
      </p>

      <!-- Bottom branding -->
      <div style="
        position:absolute; bottom:32px; left:0; right:0;
        text-align:center;
        font-size:10px;
        letter-spacing:2px;
        text-transform:uppercase;
        color:rgba(255,255,255,0.15);
      ">
        success-squad.in · E-Fest '26
      </div>
    </div>
  `
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function generateReceipt(reg) {
  // Build the field map from the registration record
  const fields = {
    teamId:        reg.team_id ?? '-',
    teamName:      reg.team_data?.teamName ?? '-',
    leaderName:    reg.team_data?.leaderName ?? '-',
    eventName:     resolveEventName(reg.event_id),
    amountINR:     reg.amount_inr ?? '-',
    transactionId: reg.utr ?? '-',
    verifiedDate:  formatVerifiedDate(reg.verified_at),
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
      scale: 2,          // 2× for crisp output
      useCORS: true,
      backgroundColor: '#0f0f1a',
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width / 2, canvas.height / 2],  // match rendered size
    })
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
    pdf.save(`receipt-${fields.teamId}.pdf`)
  } finally {
    document.body.removeChild(container)
  }
}
