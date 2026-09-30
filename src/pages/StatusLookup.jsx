/**
 * StatusLookup.jsx — Public (but unlisted/noindex) status check page.
 *
 * Registrants enter their Team ID to check:
 *   - "Pending"  → waiting for admin verification
 *   - "Verified" → confirmed + downloadable receipt
 *
 * This page is:
 *   - NOT linked from any nav, footer, or internal Link
 *   - Tagged noindex,nofollow
 *   - Reachable only by direct URL or from the ConfirmationStep link
 */

import { useState } from 'react'
import { Helmet }   from 'react-helmet-async'
import { getRegistrationByTeamId } from '../services/registrations.js'

function Receipt({ reg }) {
  const handlePrint = () => window.print()

  return (
    <div className="receipt-wrap" id="printable-receipt">
      <div className="receipt-card">
        <div className="receipt-header">
          <span className="section-label">E-Fest '26 · Success Squad</span>
          <h2 className="receipt-title">Registration Receipt</h2>
        </div>

        <div className="receipt-grid">
          <div className="receipt-row"><span>Team ID</span><strong>{reg.teamId}</strong></div>
          <div className="receipt-row"><span>Team Name</span><strong>{reg.teamName}</strong></div>
          <div className="receipt-row"><span>Event</span><strong>{reg.eventId}</strong></div>
          <div className="receipt-row"><span>Leader</span><strong>{reg.leaderName}</strong></div>
          <div className="receipt-row"><span>Status</span>
            <strong className={`status-badge status-${reg.status}`}>{reg.status}</strong>
          </div>
          {reg.verifiedAt && (
            <div className="receipt-row">
              <span>Verified On</span>
              <strong>{reg.verifiedAt?.toDate?.()?.toLocaleDateString() ?? '—'}</strong>
            </div>
          )}
        </div>

        <button className="btn btn-primary" onClick={handlePrint} style={{ marginTop: 24 }}
          aria-label="Print or save receipt">
          🖨 Download / Print Receipt
        </button>
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
                placeholder="e.g. BGMI-00001"
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
                Double-check your Team ID — it was shown on your confirmation screen (e.g. BGMI-00001).
              </p>
            </div>
          )}

          {result && (
            <div className="status-result" aria-live="polite">
              {result.status === 'pending' ? (
                <div className="status-pending-box">
                  <span className="status-badge status-pending" style={{ fontSize: '1rem' }}>Pending Verification</span>
                  <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>
                    Your registration for <strong>{result.teamName}</strong> ({result.eventId}) is received.
                    The team will verify your payment soon. Check back later.
                  </p>
                </div>
              ) : (
                <Receipt reg={result} />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
