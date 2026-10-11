/**
 * StatusLookup.jsx - Public (but unlisted/noindex) status check page.
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
import ReceiptGate from '../components/ui/ReceiptGate.jsx'
import { useReceiptDownload } from '../hooks/useReceiptDownload.js'

function ReceiptCard({ reg, onDownloadComplete }) {
  const { downloadReceipt, downloading, error } = useReceiptDownload()
  const isVerified = reg.status === 'confirmed' || reg.status === 'verified'
  const [downloadVal, setDownloadVal] = useState('')

  const handleDownload = async () => {
    if (!downloadVal) return
    const success = await downloadReceipt(reg.team_id, downloadVal)
    if (success && onDownloadComplete) {
      onDownloadComplete()
    }
  }

  // If verified but not downloaded, show the Gate
  if (isVerified && !reg.receipt_downloaded_at) {
    return <ReceiptGate registration={reg} onDownloaded={onDownloadComplete} />
  }

  return (
    <div className="receipt-wrap" id="printable-receipt">
      <div className="receipt-card">
        <div className="receipt-header">
          <span className="section-label">E-Fest '26 · Success Squad</span>
          <h2 className="receipt-title">Registration Confirmed</h2>
        </div>

        <div className="receipt-grid">
          <div className="receipt-row"><span>Team ID</span><strong>{reg.team_id}</strong></div>
          <div className="receipt-row"><span>Team Name</span><strong>{reg.team_data?.teamName ?? '-'}</strong></div>
          <div className="receipt-row"><span>Leader</span><strong>{reg.team_data?.leaderName ?? '-'}</strong></div>
          <div className="receipt-row"><span>Event</span><strong>{reg.event_id}</strong></div>
          <div className="receipt-row">
            <span>Status</span>
            <strong className={`status-badge status-${reg.status}`}>{reg.status}</strong>
          </div>
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

        {/* Download Receipt, visible and active ONLY once verified and already downloaded once */}
        {isVerified ? (
          <div style={{ marginTop: 24, padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <p style={{ fontSize: '0.88rem', marginBottom: '12px' }}>Download your official receipt PDF again:</p>
            <input 
              type="text" 
              placeholder="Leader Email or Phone (last 4)" 
              value={downloadVal}
              onChange={(e) => setDownloadVal(e.target.value)}
              style={{ width: '100%', marginBottom: '12px', padding: '8px' }}
              disabled={downloading}
            />
            <button
              className="btn btn-primary"
              onClick={handleDownload}
              disabled={downloading || !downloadVal}
              id="download-receipt-btn"
              style={{ width: '100%' }}
            >
              {downloading ? 'Downloading…' : '⬇ Download Receipt (PDF)'}
            </button>
            {error && <p className="reg-error" style={{ marginTop: 8 }}>{error}</p>}
          </div>
        ) : (
          <div style={{ marginTop: 24 }}>
            <button
              className="btn btn-ghost"
              disabled
              id="download-receipt-btn-locked"
              style={{ width: '100%', opacity: 0.45, cursor: 'not-allowed' }}
              aria-label="Receipt download unavailable until payment is verified"
            >
              🔒 Receipt Available After Verification
            </button>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
              Your payment is being reviewed. Come back once verified.
            </p>
          </div>
        )}
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
        <title>Check Registration Status, E-Fest '26</title>
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
                Double-check your Team ID, it was shown on your confirmation screen (e.g. BGMI-00001, CRAFT-00001).
              </p>
            </div>
          )}

          {result && (
            <div className="status-result" aria-live="polite">
              {result.status === 'pending' || result.status === 'submitted' ? (
                <div className="status-pending-box">
                  <span className="status-badge status-pending" style={{ fontSize: '1rem' }}>Pending Verification</span>
                  <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>
                    Your registration for <strong>{result.team_data?.teamName ?? result.team_id}</strong> ({result.event_id}) is received.
                    Our team will verify your payment shortly. Check back here for your Team ID.
                  </p>
                </div>
              ) : (
                <ReceiptCard 
                  reg={result} 
                  onDownloadComplete={() => {
                    // Update local state to hide the gate
                    setResult({ ...result, receipt_downloaded_at: new Date().toISOString() })
                  }} 
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
