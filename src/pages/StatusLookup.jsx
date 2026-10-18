/**
 * StatusLookup.jsx - Public (but unlisted/noindex) status check page.
 *
 * Registrants enter their Team ID or Order ID to check:
 *   - "Pending"  → waiting for admin verification (with downloadable acknowledgement receipt)
 *   - "Verified" → confirmed + downloadable official receipt
 */

import { useState } from 'react'
import { Helmet }   from 'react-helmet-async'
import {
  getRegistrationByTeamId,
  getRegistrationByOrderId,
  getPendingPaymentByOrderId,
} from '../services/registrations.js'
import { generateReceipt } from '../utils/generateReceipt.js'

function ReceiptCard({ reg, onDownloadComplete }) {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const isVerified = reg.status === 'confirmed' || reg.status === 'verified'

  const handleDownload = async () => {
    setDownloading(true)
    setError('')
    try {
      await generateReceipt({
        team_id:     reg.team_id || reg.order_id,
        order_id:    reg.order_id || reg.team_id,
        event_id:    reg.event_id,
        team_data:   reg.team_data,
        amount_inr:  reg.amount_inr,
        utr:         reg.utr,
        verified_at: reg.verified_at,
        created_at:  reg.created_at,
        status:      reg.status,
      })
      if (onDownloadComplete) onDownloadComplete()
    } catch (err) {
      console.error(err)
      setError('Failed to generate receipt PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const isIndividual = reg.event_id === 'money-makers'
  const displayName = isIndividual
    ? (reg.team_data?.leaderName ?? reg.team_data?.name ?? '-')
    : (reg.team_data?.teamName ?? '-')

  return (
    <div className="receipt-wrap" id="printable-receipt">
      <div className="receipt-card">
        <div className="receipt-header">
          <span className="section-label">E-Fest '26 · Success Squad</span>
          <h2 className="receipt-title">
            {isVerified ? 'Registration Confirmed' : 'Registration Submitted'}
          </h2>
        </div>

        <div className="receipt-grid">
          <div className="receipt-row">
            <span>{isVerified ? 'Team ID' : 'Order ID'}</span>
            <strong style={{ color: 'var(--accent, #6366f1)' }}>{reg.team_id || reg.order_id}</strong>
          </div>
          <div className="receipt-row">
            <span>{isIndividual ? 'Participant Name' : 'Team Name'}</span>
            <strong>{displayName}</strong>
          </div>
          <div className="receipt-row">
            <span>{isIndividual ? 'Contact Person' : 'Team Leader'}</span>
            <strong>{reg.team_data?.leaderName ?? reg.team_data?.name ?? '-'}</strong>
          </div>
          <div className="receipt-row">
            <span>Event</span>
            <strong>{reg.event_id}</strong>
          </div>
          <div className="receipt-row">
            <span>Status</span>
            <strong className={`status-badge status-${reg.status}`}>
              {isVerified ? 'Verified ✓' : 'Pending Verification ⏳'}
            </strong>
          </div>
          {reg.amount_inr && (
            <div className="receipt-row">
              <span>Amount Paid</span>
              <strong>₹{reg.amount_inr}</strong>
            </div>
          )}
          {reg.verified_at && (
            <div className="receipt-row">
              <span>Verified On</span>
              <strong>
                {new Date(reg.verified_at).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric'
                })}
              </strong>
            </div>
          )}
          <div className="receipt-row">
            <span>Transaction ID</span>
            <strong style={{ wordBreak: 'break-all' }}>{reg.utr ?? '-'}</strong>
          </div>
        </div>

        {/* Download Receipt Button */}
        <div style={{ marginTop: 24 }}>
          <button
            className="btn btn-primary"
            onClick={handleDownload}
            disabled={downloading}
            id="download-receipt-btn"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '14px 20px',
              fontWeight: 700,
              fontSize: '1rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            }}
          >
            {downloading ? (
              <><span className="reg-spinner" aria-hidden="true" style={{ width: 18, height: 18 }} /> Generating Receipt PDF…</>
            ) : (
              <>⬇ Download Receipt (PDF)</>
            )}
          </button>
          {error && <p className="reg-error" style={{ marginTop: 8 }}>{error}</p>}
        </div>
      </div>
    </div>
  )
}

export default function StatusLookup() {
  const [query, setQuery]     = useState('')
  const [result, setResult]   = useState(null)   // registration/order doc or null
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [searched, setSearched] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const raw = query.trim()
    if (!raw) return
    setError('')
    setResult(null)
    setSearched(false)
    setLoading(true)

    try {
      const upper = raw.toUpperCase()
      // 1. Try team_id lookup in verified registrations
      let doc = await getRegistrationByTeamId(upper)

      // 2. If not found, try order_id lookup in registrations
      if (!doc) {
        doc = await getRegistrationByOrderId(raw)
      }

      // 3. If still not found, try order_id lookup in pending_payments
      if (!doc) {
        const pending = await getPendingPaymentByOrderId(raw)
        if (pending) {
          doc = {
            ...pending,
            team_id: pending.order_id,
            isPending: true,
          }
        }
      }

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
        <title>Check Registration Status, E-Fest '26</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="hub-page">
        <div className="hub-header">
          <div className="section-label">E-Fest '26</div>
          <h1 className="hub-title">Check <span className="accent">Status</span></h1>
          <p className="hub-sub">Enter your Team ID or Order ID to view your registration status and download receipt.</p>
        </div>

        <div className="status-lookup-form-wrap">
          <form className="status-lookup-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="lookup-teamid">Team ID or Order ID</label>
              <input
                id="lookup-teamid"
                type="text"
                placeholder="e.g. BGMI-00001 or SS-1791873"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                style={{ letterSpacing: 1 }}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading || !query.trim()}>
              {loading ? 'Looking up…' : 'Check Status →'}
            </button>
          </form>

          {error && <p className="reg-error" role="alert" style={{ marginTop: 16 }}>{error}</p>}

          {searched && !result && !error && (
            <div className="status-not-found">
              <p>No registration found for <strong>{query.trim()}</strong>.</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 8 }}>
                Double-check your ID, it was shown on your confirmation screen (e.g. BGMI-00001, CRAFT-00001, or your Order ID).
              </p>
            </div>
          )}

          {result && (
            <div className="status-result" aria-live="polite">
              <ReceiptCard 
                reg={result} 
                onDownloadComplete={() => {
                  setResult({ ...result, receipt_downloaded_at: new Date().toISOString() })
                }} 
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
