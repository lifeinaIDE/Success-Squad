/**
 * src/utils/exportToExcel.js
 *
 * Exports student registrations and payments to a cleanly formatted Microsoft Excel (.xlsx) file.
 * Includes column auto-width calculation, friendly event names, and complete team/member details.
 */

import * as XLSX from 'xlsx'

const EVENT_NAMES = {
  'bgmi-lec':      'BGMI LEC — Esports Championship',
  'fflec':         'Free Fire Max (FFLEC) Tournament',
  'craftcode':     'CraftCode — National Hackathon',
  'ipl-auction':   'IPL Mega Auction Simulation',
  'startup-pitch': 'Startup Pitch Battle (Shark Tank)',
  'money-makers':  'Money Makers — Trading & Finance',
}

function resolveEventName(eventId) {
  return EVENT_NAMES[eventId] ?? (eventId ? String(eventId).toUpperCase() : 'General Event')
}

function formatMember(m, index) {
  if (!m) return '—'
  const name = typeof m === 'string' ? m : (m.name || `Member ${index}`)
  const email = typeof m === 'object' && m.email ? ` (${m.email})` : ''
  const phone = typeof m === 'object' && m.phone ? ` [${m.phone}]` : ''
  return `${name}${email}${phone}`
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(iso)
  }
}

/**
 * Transforms raw Supabase registration / pending_payment rows into structured Excel rows
 */
export function formatRegistrationsForExcel(rows = []) {
  return rows.map((r, idx) => {
    const teamData = r.team_data || {}
    const members = Array.isArray(teamData.members) ? teamData.members : []
    const isUnstop = r.status === 'pending_unstop_review'
    const eventFriendly = resolveEventName(r.event_id)

    let statusDisplay = 'PENDING REVIEW'
    if (r.status === 'verified' || r.status === 'confirmed') statusDisplay = 'CONFIRMED / VERIFIED'
    else if (r.status === 'rejected') statusDisplay = 'REJECTED'
    else if (r.status === 'pending_unstop_review') statusDisplay = 'UNSTOP PENDING REVIEW'
    else if (r.status === 'submitted') statusDisplay = 'PAYMENT SUBMITTED'

    return {
      'Sr. No.': idx + 1,
      'Registration Status': statusDisplay,
      'Official Team ID': r.team_id || '—',
      'Order ID': r.order_id || '—',
      'Event Name': eventFriendly,
      'Event ID': r.event_id || '—',
      'Team Name': teamData.teamName || '—',
      'Leader Name': teamData.leaderName || '—',
      'Leader Phone': teamData.leaderPhone || '—',
      'Leader Email': teamData.leaderEmail || '—',
      'Total Team Members': 1 + members.length,
      'Squad Member 2': formatMember(members[0], 2),
      'Squad Member 3': formatMember(members[1], 3),
      'Squad Member 4': formatMember(members[2], 4),
      'Squad Member 5': formatMember(members[3], 5),
      'Amount Paid (₹)': r.amount_inr ?? 0,
      'Payment Type': isUnstop ? 'Unstop Registration' : 'UPI QR',
      'Transaction / UTR / Unstop ID': r.utr || '—',
      'Submission Timestamp': formatDate(r.created_at),
      'Verified Timestamp': formatDate(r.verified_at),
      'Payment Proof Screenshot': r.screenshot_url || '—',
      'Rejection Reason': r.rejection_reason || '—',
    }
  })
}

/**
 * Triggers browser download of the formatted Excel spreadsheet
 */
export function exportRegistrationsToExcel(rows = [], filenamePrefix = 'EFest26_Registrations') {
  if (!rows || rows.length === 0) {
    throw new Error('No registrations found to export.')
  }

  const formattedRows = formatRegistrationsForExcel(rows)

  // Create sheet
  const worksheet = XLSX.utils.json_to_sheet(formattedRows)

  // Auto calculate reasonable column widths
  const colWidths = {}
  formattedRows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      const valLen = String(row[key] ?? '').length
      const keyLen = key.length
      const longest = Math.max(valLen, keyLen)
      colWidths[key] = Math.max(colWidths[key] || 10, longest)
    })
  })

  worksheet['!cols'] = Object.keys(colWidths).map((key) => ({
    wch: Math.min(Math.max(colWidths[key] + 3, 12), 40),
  }))

  // Create workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants')

  // Generate filename with date
  const dateStr = new Date().toISOString().slice(0, 10)
  const fullFilename = `${filenamePrefix}_${dateStr}.xlsx`

  // Download
  XLSX.writeFile(workbook, fullFilename)
}
