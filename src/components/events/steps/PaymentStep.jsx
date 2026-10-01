/**
 * PaymentStep — Step 2 of RegistrationModal.
 *
 * Flow:
 *  1. Initial state: single "Unlock Payment QR" button.
 *  2. On tap: calls createPaymentOrder Edge Function → reveals QR + countdown.
 *  3. subscribeToOrderStatus sets up Supabase Realtime on the pending_payments row.
 *  4. When status flips to 'paid' (written server-side by the webhook), auto-advances.
 *  5. Countdown expiry calls expireOrder and shows retry state.
 */

import { useState, useEffect, useCallback } from 'react'
import { createPaymentOrder, subscribeToOrderStatus, expireOrder } from '../../../services/registrations.js'

function isMobile() {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// 'initial' | 'creating' | 'active' | 'expired' | 'error'
export default function PaymentStep({ config, teamName, formData, onSubmit, onBack }) {
  const [phase, setPhase]       = useState('initial')
  const [orderData, setOrderData] = useState(null)  // { orderId, upiIntentLink, expiresAt, amountINR }
  const [timeLeft, setTimeLeft]  = useState(300)
  const [errorMsg, setErrorMsg]  = useState('')

  // ── 1. Create order ──────────────────────────────────────────
  const handleUnlock = async () => {
    setPhase('creating')
    setErrorMsg('')
    try {
      const result = await createPaymentOrder(config.id, formData)
      setOrderData(result)
      setPhase('active')
      const remaining = Math.max(0, Math.floor((new Date(result.expiresAt).getTime() - Date.now()) / 1000))
      setTimeLeft(remaining)
    } catch (err) {
      console.error(err)
      setErrorMsg(err?.message || 'Failed to create payment order. Please try again.')
      setPhase('error')
    }
  }

  // ── 2. Countdown timer (synced to server expiresAt) ──────────
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

  // ── 3. Realtime subscription (Supabase) ──────────────────────
  useEffect(() => {
    if (phase !== 'active' || !orderData) return

    const unsubscribe = subscribeToOrderStatus(orderData.orderId, (updatedRow) => {
      if (updatedRow.status === 'paid') {
        setPhase('paid')
        // Auto-advance: pass orderId + paymentId to parent
        onSubmit({ orderId: updatedRow.order_id, paymentId: updatedRow.razorpay_payment_id })
      } else if (updatedRow.status === 'expired' || updatedRow.status === 'failed') {
        setPhase('expired')
      }
    })

    return unsubscribe
  }, [phase, orderData, onSubmit])

  // ── 4. Manual expiry (client countdown hits 0) ────────────────
  const handleTimerExpiry = useCallback(async () => {
    setPhase('expired')
    if (!orderData) return
    try {
      await expireOrder(orderData.orderId)
    } catch (e) {
      console.warn('expireOrder call failed:', e)
    }
  }, [orderData])

  // ── Render ────────────────────────────────────────────────────
  const isUrgent = timeLeft < 60

  return (
    <div className="reg-form">
      <h3 className="reg-step-title">Payment</h3>

      {/* Order summary — always visible */}
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
            Generate a unique, time-limited QR code for this payment.
            You'll have <strong>5 minutes</strong> to complete the transaction.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUnlock}
            disabled={phase === 'creating'}
            id="unlock-payment-qr-btn"
          >
            {phase === 'creating'
              ? <><span className="reg-spinner" aria-hidden="true" /> Generating…</>
              : '🔒 Unlock Payment QR'}
          </button>
          {errorMsg && <p className="reg-error" role="alert" style={{ marginTop: 16 }}>{errorMsg}</p>}
        </div>
      )}

      {/* ── ACTIVE state: QR + countdown ── */}
      {phase === 'active' && orderData && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>

          {/* Countdown */}
          <div
            aria-live="polite"
            aria-label={`${formatTime(timeLeft)} remaining`}
            style={{
              fontSize: '2.4rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              color: isUrgent ? '#ef4444' : 'var(--accent)',
              marginBottom: 20,
              transition: 'color 0.5s ease',
            }}
          >
            {formatTime(timeLeft)}
          </div>

          {/* QR — Razorpay-hosted tracked image (fires webhook on scan+pay) */}
          <div style={{
            display: 'inline-block',
            background: '#fff',
            padding: 14,
            borderRadius: 14,
            marginBottom: 20,
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
          }}>
            {orderData.qrImageUrl ? (
              <img
                src={orderData.qrImageUrl}
                alt="UPI payment QR code"
                width={200}
                height={200}
                style={{ display: 'block' }}
              />
            ) : (
              // Fallback: plain UPI QR if Razorpay QR creation failed
              <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#666', textAlign: 'center', padding: 8 }}>
                QR unavailable.<br />Use the Pay button below.
              </div>
            )}
          </div>

          {/* Mobile: UPI deep link as primary */}
          {isMobile() ? (
            <a
              href={orderData.upiIntentLink}
              className="btn btn-primary reg-upi-btn"
              style={{ display: 'block', marginBottom: 12 }}
              id="upi-pay-btn"
            >
              📱 Pay ₹{orderData.amountINR} via UPI App
            </a>
          ) : (
            <p className="payment-desktop-note" style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              💻 Scan the QR code from your phone's UPI app. Keep this tab open.
            </p>
          )}

          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 14 }}>
            {isUrgent
              ? '⚠️ Payment window closing soon. Complete the transaction now.'
              : 'Waiting for payment confirmation… Do not close this window.'}
          </p>
        </div>
      )}

      {/* ── EXPIRED / FAILED state ── */}
      {phase === 'expired' && (
        <div style={{ textAlign: 'center', padding: '36px 0' }}>
          <p style={{ color: '#ef4444', marginBottom: 16, fontSize: '1rem' }}>
            Payment window expired or transaction failed.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => { setPhase('initial'); setOrderData(null); setTimeLeft(300) }}
            id="retry-payment-btn"
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
          disabled={phase === 'creating' || phase === 'active'}
        >
          ← Back to Details
        </button>
      </div>
    </div>
  )
}
