/**
 * PaymentStep - Step 2 of RegistrationModal (Manual Verification).
 *
 * FIXES applied:
 *  - Slot is held ONCE on mount via useRef flag (no re-trigger on formData change)
 *  - 12-second timeout in holdSlot service prevents infinite spinner
 *  - Animated loading state with progress dots so user knows something is happening
 *  - "Try Again" button on error
 *  - QR code shown immediately once slot is held
 *
 * UI order (top to bottom in active state):
 *   (1) QR code + UPI ID   (2) Screenshot upload   (3) Transaction ID   (4) Submit
 *
 * NOTE: DB column name = `utr`. All UI labels say "Transaction ID".
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { holdSlot, expireOrder, submitPaymentProof } from '../../../services/registrations.js'

function isMobile() {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Animated loading dots so the user knows something is actually happening
function LoadingDots() {
  const [dots, setDots] = useState('')
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 450)
    return () => clearInterval(id)
  }, [])
  return <span aria-hidden="true">{dots}</span>
}

export default function PaymentStep({ config, teamName, formData, onSubmit, onBack }) {
  const [phase, setPhase]       = useState('creating') // creating | active | submitting | expired | error
  const [orderData, setOrderData] = useState(null)
  const [timeLeft, setTimeLeft]   = useState(300)
  const [errorMsg, setErrorMsg]   = useState('')

  // Form fields
  const [utr, setUtr]           = useState('')
  const [file, setFile]         = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)

  // ── Guard: run holdSlot EXACTLY ONCE on mount ──────────────────────────────
  // Using a ref prevents re-triggering when formData object reference changes.
  const holdCalled = useRef(false)

  useEffect(() => {
    if (holdCalled.current) return
    holdCalled.current = true

    let mounted = true

    holdSlot(config.id, formData, config.entryFee)
      .then((result) => {
        if (!mounted) return
        setOrderData(result)
        setPhase('active')
        const remaining = Math.max(
          0,
          Math.floor((new Date(result.expiresAt).getTime() - Date.now()) / 1000)
        )
        setTimeLeft(remaining)
      })
      .catch((err) => {
        if (!mounted) return
        console.error('[holdSlot]', err)
        setErrorMsg(err?.message || 'Failed to hold slot. Please try again.')
        setPhase('error')
      })

    return () => { mounted = false }
  }, []) // ← intentionally empty: run once on mount only

  // ── Retry: reset guard and re-trigger ─────────────────────────────────────
  const handleRetry = useCallback(() => {
    holdCalled.current = false
    setPhase('creating')
    setErrorMsg('')
    setOrderData(null)
    setTimeLeft(300)
    setUtr('')
    setFile(null)
    setPreviewUrl(null)
  }, [])

  // ── Countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'active' || !orderData) return

    const tick = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(orderData.expiresAt).getTime() - Date.now()) / 1000)
      )
      setTimeLeft(remaining)
      if (remaining <= 0) {
        clearInterval(tick)
        handleTimerExpiry()
      }
    }, 1000)

    return () => clearInterval(tick)
  }, [phase, orderData])

  // ── Screenshot preview ─────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onloadend = () => setPreviewUrl(reader.result)
    reader.readAsDataURL(f)
  }

  // ── Submit Proof ───────────────────────────────────────────────────────────
  const handleSubmitProof = async (e) => {
    e.preventDefault()
    if (!file)       { setErrorMsg('Please upload your payment screenshot.'); return }
    if (!utr.trim()) { setErrorMsg('Please enter your Transaction ID.');       return }

    setPhase('submitting')
    setErrorMsg('')
    try {
      await submitPaymentProof(orderData.orderId, config.id, utr.trim(), file)
      onSubmit({ orderId: orderData.orderId })
    } catch (err) {
      console.error('[submitProof]', err)
      setErrorMsg(err?.message || 'Failed to submit proof. Please try again.')
      setPhase('active')
    }
  }

  // ── Timer expiry ───────────────────────────────────────────────────────────
  const handleTimerExpiry = useCallback(async () => {
    setPhase('expired')
    if (!orderData) return
    try { await expireOrder(orderData.orderId) } catch (e) { console.warn(e) }
  }, [orderData])

  const isUrgent = timeLeft < 60
  const intentLink = `upi://pay?pa=${config.upiId}&pn=SuccessSquad&am=${config.entryFee}&cu=INR&tn=${encodeURIComponent(config.name + ' Registration')}`

  return (
    <div className="reg-form">
      <h3 className="reg-step-title">Payment</h3>

      {/* Order summary */}
      <div className="payment-summary">
        <div className="payment-summary-row">
          <span>Event</span><strong>{config.name}</strong>
        </div>
        <div className="payment-summary-row">
          <span>Team</span><strong>{teamName || '-'}</strong>
        </div>
        <div className="payment-summary-row payment-summary-total">
          <span>Amount</span><strong>₹{config.entryFee}</strong>
        </div>
      </div>

      {/* ── CREATING: animated loading ── */}
      {phase === 'creating' && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          {/* Pulsing circle */}
          <div style={{
            width: 56, height: 56,
            borderRadius: '50%',
            border: '4px solid rgba(99,102,241,0.2)',
            borderTopColor: 'var(--accent)',
            margin: '0 auto 20px',
            animation: 'spin 0.8s linear infinite',
          }} aria-hidden="true" />
          <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 6 }}>
            Securing your spot<LoadingDots />
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: 280, margin: '0 auto' }}>
            We're reserving your slot for 5 minutes. This usually takes a second.
          </p>
        </div>
      )}

      {/* ── ERROR ── */}
      {phase === 'error' && (
        <div style={{ textAlign: 'center', padding: '36px 0' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
          <p className="reg-error" role="alert" style={{ marginBottom: 20, maxWidth: 340, margin: '0 auto 20px' }}>
            {errorMsg}
          </p>
          <button type="button" className="btn btn-primary" onClick={handleRetry}>
            ↻ Try Again
          </button>
        </div>
      )}

      {/* ── ACTIVE / SUBMITTING: QR + form ── */}
      {(phase === 'active' || phase === 'submitting') && orderData && (
        <div style={{ marginTop: 20 }}>

          {/* Countdown */}
          <div
            aria-live="polite"
            style={{
              textAlign: 'center',
              fontSize: '1.8rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              color: isUrgent ? '#ef4444' : 'var(--accent)',
              marginBottom: 4,
              transition: 'color 0.5s ease',
            }}
          >
            {formatTime(timeLeft)}
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 20 }}>
            {isUrgent ? '⚠️ Less than a minute left! Submit now.' : 'Slot held, complete payment and submit proof below'}
          </p>

          {/* (1) QR + UPI */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              display: 'inline-block',
              background: '#fff',
              padding: 14,
              borderRadius: 14,
              marginBottom: 12,
            }}>
              <img
                src={config.qrCodeImage || '/images/placeholder-qr.svg'}
                alt={`UPI QR for ${config.upiId}`}
                width={190}
                height={190}
                style={{ display: 'block', objectFit: 'contain' }}
              />
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff', marginBottom: 8, fontSize: '1rem' }}>
              {config.upiId}
            </p>
            {isMobile() && (
              <a href={intentLink} className="btn btn-secondary" style={{ display: 'inline-block', marginBottom: 4 }}>
                📱 Pay via UPI App
              </a>
            )}
          </div>

          {/* (2) + (3) Proof form */}
          <form onSubmit={handleSubmitProof} style={{
            background: 'rgba(255,255,255,0.03)',
            padding: 20,
            borderRadius: 12,
            border: '1px solid var(--border)',
          }}>
            <h4 style={{ marginBottom: 16, fontSize: '0.9rem', fontWeight: 700 }}>Submit Proof of Payment</h4>

            {/* Screenshot */}
            <div className="form-group">
              <label htmlFor="screenshot">Payment Screenshot</label>
              <input
                ref={fileInputRef}
                id="screenshot"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
                disabled={phase === 'submitting'}
                className="form-input"
                style={{ padding: '8px' }}
              />
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Screenshot preview"
                  style={{ marginTop: 8, maxWidth: '100%', maxHeight: 160, borderRadius: 8, objectFit: 'contain', border: '1px solid var(--border)' }}
                />
              )}
            </div>

            {/* Transaction ID */}
            <div className="form-group" style={{ marginTop: 16 }}>
              <label htmlFor="utr">Transaction ID</label>
              <input
                id="utr"
                type="text"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="12-digit UPI Transaction ID (UTR)"
                required
                disabled={phase === 'submitting'}
                className="form-input"
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Found in your UPI app under transaction history.
              </p>
            </div>

            {errorMsg && <p className="reg-error" style={{ marginBottom: 12 }} role="alert">{errorMsg}</p>}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={phase === 'submitting'}
              style={{ width: '100%', marginTop: 8 }}
            >
              {phase === 'submitting'
                ? <><span className="reg-spinner" aria-hidden="true" /> Submitting…</>
                : 'Submit Proof'}
            </button>
          </form>
        </div>
      )}

      {/* ── EXPIRED ── */}
      {phase === 'expired' && (
        <div style={{ textAlign: 'center', padding: '36px 0' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏰</div>
          <p style={{ color: '#ef4444', marginBottom: 16, fontSize: '1rem' }}>
            Time expired, your slot hold was released.
          </p>
          <button type="button" className="btn btn-primary" onClick={handleRetry}>
            ↻ Try Again
          </button>
        </div>
      )}

      {/* Back button, only available before slot is held */}
      <div className="reg-footer-actions" style={{ marginTop: 24 }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onBack}
          disabled={phase === 'active' || phase === 'submitting'}
          style={{ opacity: (phase === 'active' || phase === 'submitting') ? 0.3 : 1 }}
        >
          ← Back
        </button>
      </div>
    </div>
  )
}
