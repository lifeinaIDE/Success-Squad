/**
 * PaymentStep — Step 2 of RegistrationModal (Manual Verification).
 *
 * Flow:
 *  1. Initial state: "Unlock Payment QR" button.
 *  2. On tap: calls holdSlot RPC to lock capacity → reveals static QR + countdown + proof form.
 *  3. User uploads screenshot and enters UTR.
 *  4. On submit: calls submitPaymentProof, sets row to 'submitted', auto-advances.
 *  5. Countdown expiry calls expireOrder and shows retry state.
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

export default function PaymentStep({ config, teamName, formData, onSubmit, onBack }) {
  const [phase, setPhase]        = useState('initial') // initial | creating | active | submitting | expired | error
  const [orderData, setOrderData]  = useState(null)    // { id, orderId, expiresAt }
  const [timeLeft, setTimeLeft]    = useState(300)
  const [errorMsg, setErrorMsg]    = useState('')
  
  // Form fields
  const [utr, setUtr] = useState('')
  const [file, setFile] = useState(null)
  const fileInputRef = useRef(null)

  // ── 1. Hold Slot ─────────────────────────────────────────────
  const handleUnlock = async () => {
    setPhase('creating')
    setErrorMsg('')
    try {
      const result = await holdSlot(config.id, formData, config.entryFee)
      setOrderData(result)
      setPhase('active')
      const remaining = Math.max(0, Math.floor((new Date(result.expiresAt).getTime() - Date.now()) / 1000))
      setTimeLeft(remaining)
    } catch (err) {
      console.error(err)
      setErrorMsg(err?.message || 'Failed to hold slot. Event might be sold out.')
      setPhase('error')
    }
  }

  // ── 2. Countdown timer ───────────────────────────────────────
  useEffect(() => {
    if (phase !== 'active' || !orderData) return

    const tick = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(orderData.expiresAt).getTime() - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining <= 0) {
        clearInterval(tick)
        handleTimerExpiry()
      }
    }, 1000)

    return () => clearInterval(tick)
  }, [phase, orderData])

  // ── 3. Submit Proof ──────────────────────────────────────────
  const handleSubmitProof = async (e) => {
    e.preventDefault()
    if (!utr || !file) {
      setErrorMsg('Both UTR and screenshot are required.')
      return
    }
    
    setPhase('submitting')
    setErrorMsg('')
    try {
      // Once submitted, the backend prevents expiry
      await submitPaymentProof(orderData.orderId, config.id, utr.trim(), file)
      onSubmit({ orderId: orderData.orderId })
    } catch (err) {
      console.error(err)
      setErrorMsg(err?.message || 'Failed to submit proof. Please try again.')
      setPhase('active')
    }
  }

  // ── 4. Manual expiry ─────────────────────────────────────────
  const handleTimerExpiry = useCallback(async () => {
    setPhase('expired')
    if (!orderData) return
    try {
      await expireOrder(orderData.orderId)
    } catch (e) {
      console.warn('expireOrder call failed:', e)
    }
  }, [orderData])

  // ── Render ───────────────────────────────────────────────────
  const isUrgent = timeLeft < 60
  
  // Static intent link fallback
  const intentLink = `upi://pay?pa=${config.upiId}&pn=SuccessSquad&am=${config.entryFee}&cu=INR&tn=${config.name} Registration`

  return (
    <div className="reg-form">
      <h3 className="reg-step-title">Payment</h3>

      {/* Order summary */}
      <div className="payment-summary">
        <div className="payment-summary-row">
          <span>Event</span><strong>{config.name}</strong>
        </div>
        <div className="payment-summary-row">
          <span>Team</span><strong>{teamName || '—'}</strong>
        </div>
        <div className="payment-summary-row payment-summary-total">
          <span>Amount</span><strong>₹{config.entryFee}</strong>
        </div>
      </div>

      {/* ── INITIAL / ERROR state ── */}
      {(phase === 'initial' || phase === 'creating' || phase === 'error') && (
        <div style={{ textAlign: 'center', padding: '36px 0' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20, maxWidth: 340, margin: '0 auto 20px' }}>
            We will temporarily hold a slot for you. 
            You'll have <strong>5 minutes</strong> to pay and submit proof.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUnlock}
            disabled={phase === 'creating'}
            id="unlock-payment-qr-btn"
          >
            {phase === 'creating'
              ? <><span className="reg-spinner" aria-hidden="true" /> Holding Slot…</>
              : '🔒 Unlock Payment QR'}
          </button>
          {errorMsg && <p className="reg-error" role="alert" style={{ marginTop: 16 }}>{errorMsg}</p>}
        </div>
      )}

      {/* ── ACTIVE / SUBMITTING state: QR + Form ── */}
      {(phase === 'active' || phase === 'submitting') && orderData && (
        <div style={{ marginTop: 24 }}>
          
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            {/* Countdown */}
            <div
              aria-live="polite"
              style={{
                fontSize: '2rem',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                color: isUrgent ? '#ef4444' : 'var(--accent)',
                marginBottom: 16,
                transition: 'color 0.5s ease',
              }}
            >
              {formatTime(timeLeft)}
            </div>

            {/* Static QR */}
            <div style={{
              display: 'inline-block',
              background: '#fff',
              padding: 14,
              borderRadius: 14,
              marginBottom: 16,
            }}>
              <img
                src={config.qrCodeImage || '/images/bgmi-upi-qr.png'}
                alt={`UPI QR for ${config.upiId}`}
                width={200}
                height={200}
                style={{ display: 'block', objectFit: 'contain' }}
              />
            </div>
            
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: '#fff', marginBottom: 16 }}>
              {config.upiId}
            </p>

            {isMobile() && (
              <a href={intentLink} className="btn btn-secondary reg-upi-btn" style={{ display: 'block', marginBottom: 16 }}>
                📱 Pay via UPI App
              </a>
            )}
          </div>

          <form onSubmit={handleSubmitProof} className="proof-form" style={{ background: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
            <h4 style={{ marginBottom: 16, fontSize: '0.95rem' }}>Submit Proof of Payment</h4>
            
            <div className="form-group">
              <label htmlFor="utr">UPI Transaction Reference (UTR / 12-digit RRN)</label>
              <input
                id="utr"
                type="text"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="e.g. 412345678901"
                required
                disabled={phase === 'submitting'}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="screenshot">Payment Screenshot</label>
              <input
                ref={fileInputRef}
                id="screenshot"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])}
                required
                disabled={phase === 'submitting'}
                className="form-input"
                style={{ padding: '8px' }}
              />
            </div>

            {errorMsg && <p className="reg-error" style={{ marginBottom: 16 }}>{errorMsg}</p>}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={phase === 'submitting'}
              style={{ width: '100%' }}
            >
              {phase === 'submitting' ? 'Submitting...' : 'Submit Proof'}
            </button>
          </form>
        </div>
      )}

      {/* ── EXPIRED state ── */}
      {phase === 'expired' && (
        <div style={{ textAlign: 'center', padding: '36px 0' }}>
          <p style={{ color: '#ef4444', marginBottom: 16, fontSize: '1rem' }}>
            Time expired. Your slot hold was released.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => { setPhase('initial'); setOrderData(null); setTimeLeft(300); setUtr(''); setFile(null) }}
          >
            ↻ Try Again
          </button>
        </div>
      )}

      <div className="reg-footer-actions" style={{ marginTop: 24 }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onBack}
          disabled={phase === 'creating' || phase === 'active' || phase === 'submitting'}
        >
          ← Back to Details
        </button>
      </div>
    </div>
  )
}
