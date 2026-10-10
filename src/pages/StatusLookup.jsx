/**
 * StatusLookup.jsx — Public (but unlisted/noindex) status check page.
 *
 * Registrants enter their Team ID to check:
 *   - "Pending"  → waiting for admin verification
 *   - "Verified" → confirmed + "Download Receipt" button (active only when verified)
 *
 * This page is:
 *   - NOT linked from any nav, footer, or internal Link
 *   - Tagged noindex,nofollow
 *   - Reachable only by direct URL or from the ConfirmationStep link
 *
 * Receipt download is gated: button is hidden until status === 'confirmed'.
 * Uses generateReceipt.js (html2canvas + jsPDF, client-side, no server needed).
 */

import { useState } from 'react'
import { Helmet }   from 'react-helmet-async'
import { getRegistrationByTeamId } from '../services/registrations.js'
import { generateReceipt, printReceipt } from '../utils/generateReceipt.js'

function ReceiptCard({ reg }) {
  const [downloading, setDownloading] = useState(false)
  const [printing, setPrinting]       = useState(false)
  const [dlError, setDlError]         = useState('')

  const isVerified = reg.status === 'confirmed' || reg.status === 'verified' || reg.payment_status === 'PAID'

  const handleDownload = async () => {
    if (!isVerified) {
      setDlError('Official PAID receipts are only available after payment verification by the payment gateway.')
      return
    }
    setDownloading(true)
    setDlError('')
    try {
      await generateReceipt(reg)
    } catch (err) {
      console.error(err)
      setDlError(err.message || 'Failed to generate receipt. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handlePrint = async () => {
    if (!isVerified) {
      setDlError('Official PAID receipts can only be printed after payment verification by the payment gateway.')
      return
    }
    setPrinting(true)
    setDlError('')
    try {
      await printReceipt(reg)
    } catch (err) {
      console.error(err)
      setDlError(err.message || 'Failed to prepare print preview. Please try again.')
    } finally {
      setPrinting(false)
    }
  }

  const idToShow = reg.team_id || reg.registration_id || reg.order_id || '—'

  return (
    <div className="receipt-wrap" id="printable-receipt">
      <div className="receipt-card">
        <div className="receipt-header">
          <span className="section-label">E-Fest '26 · Success Squad</span>
          <h2 className="receipt-title">
            {isVerified ? 'Registration Confirmed & Verified' : 'Payment Received · Verification in Progress'}
          </h2>
        </div>

        <div className="receipt-grid">
          <div className="receipt-row"><span>{reg.team_id ? 'Registration ID' : 'Order ID'}</span><strong>{idToShow}</strong></div>
          <div className="receipt-row"><span>Team Name</span><strong>{reg.team_data?.teamName ?? '—'}</strong></div>
          <div className="receipt-row"><span>Leader</span><strong>{reg.team_data?.leaderName ?? '—'}</strong></div>
          <div className="receipt-row"><span>Event</span><strong>{reg.event_id}</strong></div>
          <div className="receipt-row">
            <span>Status</span>
            <strong className={`status-badge status-${isVerified ? 'verified' : 'pending'}`}>
              {isVerified ? 'VERIFIED · PAID ✓' : 'PENDING GATEWAY REVIEW ⏳'}
            </strong>
          </div>
          <div className="receipt-row">
            <span>{reg.verified_at ? 'Verified On' : 'Submitted On'}</span>
            <strong>
              {new Date(reg.verified_at || reg.created_at || Date.now()).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
              })}
            </strong>
          </div>
          <div className="receipt-row">
            <span>Transaction ID</span>
            <strong style={{ wordBreak: 'break-all' }}>{reg.utr ?? '—'}</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: 24 }}>
          {isVerified ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                className="btn btn-primary"
                onClick={handleDownload}
                disabled={downloading}
                id="lookup-download-receipt-btn"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  fontWeight: 700,
                }}
              >
                {downloading ? 'Generating PDF…' : '⬇ Download Receipt (PDF)'}
              </button>

              <button
                className="btn btn-secondary"
                onClick={handlePrint}
                disabled={printing}
                id="lookup-print-receipt-btn"
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  fontWeight: 700,
                }}
              >
                {printing ? 'Preparing…' : '🖨️ Print Receipt'}
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: '14px 16px',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 8,
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: '0.86rem', color: '#fbbf24', margin: 0, fontWeight: 600 }}>
                ⏳ Payment Gateway Verification in Progress
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6, marginBottom: 0 }}>
                Official PAID receipts are unlocked only after payment verification is confirmed by the payment gateway.
              </p>
            </div>
          )}

          {dlError && <p className="reg-error" style={{ marginTop: 10 }}>{dlError}</p>}
        </div>
      </div>
    </div>
  )
}

export default function StatusLookup() {
  const [teamId, setTeamId]   = useState('')
  const [result, setResult]   = useState(null)   // registration doc or null
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [searched, setSearched] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const id = teamId.trim().toUpperCase()
    if (!id) return
    setError('')
    setResult(null)
    setSearched(false)
    setLoading(true)

    try {
      const doc = await getRegistrationByTeamId(id)
      setResult(doc)
      setSearched(true)
    } catch {
      setError('Failed to look up your registration. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Check Registration Status — E-Fest '26</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="hub-page">
        <div className="hub-header">
          <div className="section-label">E-Fest '26</div>
          <h1 className="hub-title">Check <span className="accent">Status</span></h1>
          <p className="hub-sub">Enter your Team ID to view your registration status and receipt.</p>
        </div>

        <div className="status-lookup-form-wrap">
          <form className="status-lookup-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="lookup-teamid">Team ID</label>
              <input
                id="lookup-teamid"
                type="text"
                placeholder="e.g. BGMI-00001 or CRAFT-00001"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                style={{ textTransform: 'uppercase', letterSpacing: 1 }}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading || !teamId.trim()}>
              {loading ? 'Looking up…' : 'Check Status →'}
            </button>
          </form>

          {error && <p className="reg-error" role="alert" style={{ marginTop: 16 }}>{error}</p>}

          {searched && !result && !error && (
            <div className="status-not-found">
              <p>No registration found for <strong>{teamId.trim().toUpperCase()}</strong>.</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 8 }}>
                Double-check your Team ID — it was shown on your confirmation screen (e.g. BGMI-00001, CRAFT-00001).
              </p>
            </div>
          )}

          {result && (
            <div className="status-result" aria-live="polite">
              <ReceiptCard reg={result} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
