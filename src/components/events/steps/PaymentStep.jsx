/**
 * PaymentStep — Step 2 of RegistrationModal (Manual Verification).
 *
 * Flow:
 *  1. Initial phase is 'review': Displays the ₹199 fee and squad info clearly.
 *     Payment is NOT initiated automatically.
 *  2. User explicitly clicks "Pay ₹199 & Get QR Code" → phase transitions to 'creating'
 *     and calls holdSlot service.
 *  3. On success → phase transitions to 'active' (QR code, countdown, proof upload form).
 *  4. On error → phase transitions to 'error' with clear error messaging and options
 *     to Retry, Return to Review, or Close and return to the website.
 *  5. Users can close the modal and return to the website from any phase.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { holdSlot, expireOrder, submitPaymentProof, verifyAndSavePaymentGateway } from '../../../services/registrations.js'

function isMobile() {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function LoadingDots() {
  const [dots, setDots] = useState('')
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 450)
    return () => clearInterval(id)
  }, [])
  return <span aria-hidden="true">{dots}</span>
}

export default function PaymentStep({ config, teamName, formData, onSubmit, onBack, onClose }) {
  // Phase starts in 'review' so payment is NOT initiated automatically
  const [phase, setPhase]         = useState('review') // review | creating | active | submitting | expired | error
  const [orderData, setOrderData] = useState(null)
  const [timeLeft, setTimeLeft]   = useState(300)
  const [errorMsg, setErrorMsg]   = useState('')

  // Form fields for proof upload
  const [utr, setUtr]             = useState('')
  const [file, setFile]           = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef              = useRef(null)

  // ── Explicit Initiate Payment Handler ──────────────────────────────────────
  const handleInitiatePayment = useCallback(async () => {
    setPhase('creating')
    setErrorMsg('')

    try {
      const result = await holdSlot(config.id, formData, config.entryFee)
      setOrderData(result)
      setPhase('active')
      const remaining = Math.max(
        0,
        Math.floor((new Date(result.expiresAt).getTime() - Date.now()) / 1000)
      )
      setTimeLeft(remaining)
    } catch (err) {
      console.error('[holdSlot error]', err)
      const raw = err?.message || ''
      let displayMsg = 'Failed to reserve registration slot. Please try again.'

      if (raw.includes('Database service is not configured') || raw.includes('Supabase is not configured')) {
        displayMsg = 'Registration service is temporarily unavailable (database is not configured). Please verify your connection or contact event organizers.'
      } else if (raw.toLowerCase().includes('timeout') || raw.toLowerCase().includes('timed out')) {
        displayMsg = 'Request timed out while securing your slot. Please check your internet connection and try again.'
      } else if (raw.toLowerCase().includes('sold out')) {
        displayMsg = `Registration for ${config.name} is currently full / sold out.`
      } else if (raw) {
        displayMsg = raw
      }

      setErrorMsg(displayMsg)
      setPhase('error')
    }
  }, [config.id, config.name, config.entryFee, formData])

  // ── Countdown timer (only active during 'active' phase) ─────────────────────
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
    if (!utr.trim()) { setErrorMsg('Please enter your Transaction ID (UTR).'); return }

    setPhase('submitting')
    setErrorMsg('')
    try {
      const screenshotUrl = await submitPaymentProof(orderData.orderId, config.id, utr.trim(), file)

      // Verify payment with payment gateway and save registration & payment in Supabase
      let verifiedResult = null
      try {
        verifiedResult = await verifyAndSavePaymentGateway({
          orderId: orderData.orderId,
          utr: utr.trim(),
          eventId: config.id,
          teamData: formData,
          amountINR: config.entryFee,
          paymentMethod: 'UPI / Online Payment Gateway',
          screenshotUrl,
        })
      } catch (gateErr) {
        console.warn('Gateway verification notice:', gateErr)
      }

      onSubmit({
        orderId: orderData.orderId,
        utr: utr.trim(),
        eventId: config.id,
        team_data: formData,
        amount_inr: config.entryFee,
        status: verifiedResult ? 'verified' : 'submitted',
        payment_status: verifiedResult ? 'PAID' : 'PENDING',
        team_id: verifiedResult?.team_id || null,
        registration_id: verifiedResult?.team_id || null,
        receipt_number: verifiedResult?.receipt_number || null,
        created_at: new Date().toISOString(),
        verified_at: verifiedResult?.verified_at || null,
      })
    } catch (err) {
      console.error('[submitProof error]', err)
      setErrorMsg(err?.message || 'Failed to submit payment proof. Please try again.')
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
      {/* ── PHASE 1: PRE-PAYMENT REVIEW (Clear ₹199 Fee Display, Manual Initiation) ── */}
      {phase === 'review' && (
        <div className="payment-review-pane">
          <div className="payment-fee-card">
            <span className="fee-card-badge">Registration Summary</span>
            <div className="fee-card-amount">
              ₹{config.entryFee}
              <span className="fee-card-period">/ squad</span>
            </div>
            <p className="fee-card-desc">
              Entry fee for <strong>{config.name}</strong> (E-Fest '26). Includes all squad members.
            </p>
          </div>

          <div className="payment-summary" style={{ marginTop: 16 }}>
            <div className="payment-summary-row">
              <span>Event</span>
              <strong>{config.name}</strong>
            </div>
            <div className="payment-summary-row">
              <span>Team Name</span>
              <strong>{teamName || formData?.teamName || '—'}</strong>
            </div>
            <div className="payment-summary-row">
              <span>Team Leader</span>
              <strong>{formData?.leaderName} ({formData?.leaderPhone})</strong>
            </div>
            {formData?.leaderEmail && (
              <div className="payment-summary-row">
                <span>Leader Email</span>
                <strong>{formData.leaderEmail}</strong>
              </div>
            )}
            <div className="payment-summary-row payment-summary-total">
              <span>Total Payable</span>
              <strong className="accent" style={{ fontSize: '1.25rem' }}>₹{config.entryFee}</strong>
            </div>
          </div>

          <div className="payment-review-note" style={{
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 8,
            padding: '12px 16px',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            margin: '16px 0',
            lineHeight: 1.5,
          }}>
            ℹ️ <strong>Ready to pay?</strong> Clicking <em>Proceed to Pay</em> will reserve your squad's slot for 5 minutes and generate the official UPI payment QR code.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleInitiatePayment}
              id="initiate-payment-btn"
              style={{ width: '100%', padding: '14px 20px', fontSize: '1rem', fontWeight: 700 }}
            >
              Proceed to Pay ₹{config.entryFee} →
            </button>

            <div className="reg-footer-actions" style={{ marginTop: 6 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onBack}
                id="review-back-btn"
              >
                ← Back to Team Details
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                id="review-close-btn"
              >
                Close & Return to Website
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PHASE 2: CREATING (Explicit Slot Reservation In Progress) ── */}
      {phase === 'creating' && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{
            width: 56, height: 56,
            borderRadius: '50%',
            border: '4px solid rgba(99,102,241,0.2)',
            borderTopColor: 'var(--accent)',
            margin: '0 auto 20px',
            animation: 'spin 0.8s linear infinite',
          }} aria-hidden="true" />
          <h4 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 8 }}>
            Securing your spot<LoadingDots />
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 320, margin: '0 auto 20px', lineHeight: 1.6 }}>
            Reserving your spot for <strong>{config.name}</strong> (₹{config.entryFee}). Generating your payment session…
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setPhase('review')}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close & Return to Website
            </button>
          </div>
        </div>
      )}

      {/* ── PHASE 3: ERROR (Clear message, Retry & Exit options) ── */}
      {phase === 'error' && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
          <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 8, color: '#f87171' }}>
            Registration Error
          </h4>
          <div
            className="reg-error-network"
            role="alert"
            style={{ marginBottom: 24, maxWidth: 440, margin: '0 auto 24px', textAlign: 'left', lineHeight: 1.6 }}
          >
            {errorMsg}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleInitiatePayment}
              id="payment-retry-btn"
            >
              ↻ Try Again
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setPhase('review')}
            >
              ← Back to Review
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              id="payment-error-close-btn"
            >
              Close & Return to Website
            </button>
          </div>
        </div>
      )}

      {/* ── PHASE 4: ACTIVE / SUBMITTING (QR + Proof Form) ── */}
      {(phase === 'active' || phase === 'submitting') && orderData && (
        <div style={{ marginTop: 10 }}>
          {/* Order summary bar */}
          <div className="payment-summary" style={{ marginBottom: 16 }}>
            <div className="payment-summary-row">
              <span>Event</span><strong>{config.name}</strong>
            </div>
            <div className="payment-summary-row">
              <span>Team</span><strong>{teamName || '—'}</strong>
            </div>
            <div className="payment-summary-row payment-summary-total">
              <span>Amount</span><strong className="accent">₹{config.entryFee}</strong>
            </div>
          </div>

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
            {isUrgent ? '⚠️ Less than a minute left! Complete payment and submit proof.' : 'Slot reserved — scan UPI QR to pay ₹' + config.entryFee + ' and submit proof below'}
          </p>

          {/* (1) QR + UPI ID */}
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
                📱 Pay via UPI App (₹{config.entryFee})
              </a>
            )}
          </div>

          {/* (2) Proof form */}
          <form onSubmit={handleSubmitProof} style={{
            background: 'rgba(255,255,255,0.03)',
            padding: 20,
            borderRadius: 12,
            border: '1px solid var(--border)',
          }}>
            <h4 style={{ marginBottom: 16, fontSize: '0.9rem', fontWeight: 700 }}>Submit Proof of Payment</h4>

            {/* Screenshot */}
            <div className="form-group">
              <label htmlFor="screenshot">Payment Screenshot <span aria-hidden="true">*</span></label>
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
              <label htmlFor="utr">Transaction ID (UTR) <span aria-hidden="true">*</span></label>
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
                Found in your UPI app under transaction details.
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
                ? <><span className="reg-spinner" aria-hidden="true" /> Submitting Proof…</>
                : 'Submit Proof'}
            </button>
          </form>

          <div className="reg-footer-actions" style={{ marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
            >
              Close & Return to Website
            </button>
          </div>
        </div>
      )}

      {/* ── PHASE 5: EXPIRED ── */}
      {phase === 'expired' && (
        <div style={{ textAlign: 'center', padding: '36px 0' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏰</div>
          <p style={{ color: '#ef4444', marginBottom: 16, fontSize: '1rem', fontWeight: 600 }}>
            Time expired — your slot hold was released.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button type="button" className="btn btn-primary" onClick={handleInitiatePayment}>
              ↻ Try Again
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close & Return to Website
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

