/**
 * ConfirmationStep — Step 3 of RegistrationModal.
 *
 * Triggered automatically when the Realtime subscription in PaymentStep
 * detects status='paid'. At this point:
 *  1. The DB trigger has already inserted the registrations row.
 *  2. We fetch it by order_id to get the generated team_id.
 *  3. Display Team ID, receipt, and offer optional screenshot upload.
 */

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getRegistrationByOrderId, uploadScreenshot } from '../../../services/registrations.js'

export default function ConfirmationStep({ config, formData, paymentResult, onClose }) {
  // paymentResult = { orderId, paymentId } — passed from PaymentStep via onSubmit
  const [registration, setRegistration] = useState(null)
  const [error, setError]               = useState('')
  const [uploading, setUploading]       = useState(false)
  const [uploaded, setUploaded]         = useState(false)
  const fileInputRef = useRef(null)

  // Fetch the registration row (created by DB trigger)
  useEffect(() => {
    if (!paymentResult?.orderId) return
    let mounted = true

    // Poll briefly — the trigger fires async, so give it up to 3 seconds
    let attempts = 0
    const fetch = async () => {
      try {
        const reg = await getRegistrationByOrderId(paymentResult.orderId)
        if (mounted) {
          if (reg) {
            setRegistration(reg)
          } else if (attempts < 6) {
            attempts++
            setTimeout(fetch, 500)  // retry every 500ms for up to 3s
          } else {
            setError(
              'Payment confirmed! But registration record is taking longer than expected. ' +
              'Contact support with Payment ID: ' + paymentResult.paymentId
            )
          }
        }
      } catch (err) {
        if (mounted) setError('Payment confirmed. Failed to load registration: ' + err.message)
      }
    }
    fetch()

    return () => { mounted = false }
  }, [paymentResult])

  const handleScreenshotUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !registration?.team_id) return
    setUploading(true)
    try {
      await uploadScreenshot(registration.team_id, config.id, file)
      setUploaded(true)
    } catch (err) {
      console.error(err)
      alert('Screenshot upload failed — this is optional and does not affect your registration.')
    } finally {
      setUploading(false)
    }
  }

  if (error) {
    return (
      <div className="reg-confirmation">
        <p className="reg-error" style={{ fontSize: '0.95rem', maxWidth: 400 }}>{error}</p>
        <button className="btn btn-ghost" style={{ marginTop: 24 }} onClick={onClose}>Close</button>
      </div>
    )
  }

  if (!registration) {
    return (
      <div className="reg-confirmation" style={{ padding: '60px 0', gap: 16 }}>
        <span className="reg-spinner" style={{ width: 32, height: 32, borderWidth: 3 }} aria-label="Loading" />
        <p style={{ color: 'var(--text-muted)' }}>Finalising your registration…</p>
      </div>
    )
  }

  const teamName    = registration.team_data?.teamName ?? formData?.teamName ?? '—'
  const confirmedAt = registration.created_at
    ? new Date(registration.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  return (
    <div className="reg-confirmation" aria-live="polite">
      <div className="reg-confirmation-icon" aria-hidden="true">🎉</div>
      <h3 className="reg-step-title">You're Registered!</h3>

      {/* Team ID — primary takeaway */}
      <div className="reg-teamid-box" aria-label={`Your Team ID is ${registration.team_id}`}>
        <span className="reg-teamid-label">Your Team ID</span>
        <span className="reg-teamid-value" id="confirmed-team-id">{registration.team_id}</span>
        <button
          className="reg-teamid-copy btn btn-ghost"
          onClick={() => navigator.clipboard?.writeText(registration.team_id)}
          aria-label="Copy Team ID to clipboard"
        >
          Copy
        </button>
      </div>

      {/* ── Receipt Placeholder ── swap this block with real branding later ── */}
      <div className="receipt-placeholder" style={{
        marginTop: 24, width: '100%', textAlign: 'left',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border)',
        borderRadius: 14, padding: 20,
      }}>
        <p style={{
          fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 2,
          color: 'var(--text-muted)', marginBottom: 14
        }}>
          Payment Receipt · E-Fest '26
        </p>

        {[
          ['Team ID',    registration.team_id],
          ['Team Name',  teamName],
          ['Event',      config.name],
          ['Amount',     `₹${config.entryFee}`],
          ['Payment ID', paymentResult.paymentId],
          ['Date',       confirmedAt],
        ].map(([label, value]) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between',
            marginBottom: 10, fontSize: '0.88rem',
          }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <strong style={{ maxWidth: '55%', textAlign: 'right', wordBreak: 'break-all' }}>
              {value}
            </strong>
          </div>
        ))}
      </div>

      {/* Optional screenshot upload */}
      <div style={{ marginTop: 20, width: '100%' }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 10 }}>
          <strong>Optional:</strong> Attach your payment screenshot for your own records —
          not required, your payment is already verified by the gateway.
        </p>
        {!uploaded ? (
          <>
            <button
              className="btn btn-ghost"
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : '📎 Attach Screenshot'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleScreenshotUpload}
            />
          </>
        ) : (
          <p style={{ color: '#22c55e', fontSize: '0.85rem' }}>✅ Screenshot attached.</p>
        )}
      </div>

      <div className="reg-footer-actions" style={{ marginTop: 32, justifyContent: 'center', width: '100%' }}>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
        <Link to="/status" className="btn btn-primary" onClick={onClose} id="view-status-link">
          View Status →
        </Link>
      </div>
    </div>
  )
}
