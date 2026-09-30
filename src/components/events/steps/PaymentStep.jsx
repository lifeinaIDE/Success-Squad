/**
 * PaymentStep — Step 2 of RegistrationModal (Revised).
 *
 * Flow:
 *  - Initial state: "Unlock Payment QR" button.
 *  - On tap: calls Cloud Function `createPaymentOrder`, revealing QR + countdown.
 *  - Live countdown synced to server expiry.
 *  - Listens to `pendingPayments/{orderId}` via Firestore onSnapshot.
 *  - Automatically advances to Step 3 when status === 'paid'.
 *  - Expiry/Fail triggers `expireOrder` fallback and shows retry button.
 */

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { doc, onSnapshot } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../../../services/firebase.js'

function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function PaymentStep({
  config,
  teamName,
  formData,
  onSubmit,
  onBack,
}) {
  // states: 'initial', 'creating', 'active', 'paid', 'expired', 'error'
  const [orderState, setOrderState] = useState('initial')
  const [orderData, setOrderData]   = useState(null)
  const [timeLeft, setTimeLeft]     = useState(300)
  const [errorMsg, setErrorMsg]     = useState('')

  // 1. Create Order
  const handleUnlock = async () => {
    setOrderState('creating')
    setErrorMsg('')
    try {
      if (!functions) throw new Error('Cloud Functions not initialized')
      const createOrder = httpsCallable(functions, 'createPaymentOrder')
      const res = await createOrder({ eventId: config.id, teamData: formData })
      
      setOrderData(res.data)
      setOrderState('active')
      const remaining = Math.max(0, Math.floor((res.data.expiresAt - Date.now()) / 1000))
      setTimeLeft(remaining)
    } catch (err) {
      console.error(err)
      setErrorMsg(err.message || 'Failed to create payment order. Try again.')
      setOrderState('error')
    }
  }

  // 2. Countdown Timer
  useEffect(() => {
    if (orderState !== 'active' || !orderData) return
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((orderData.expiresAt - Date.now()) / 1000))
      setTimeLeft(remaining)
      
      if (remaining <= 0) {
        clearInterval(interval)
        if (orderState === 'active') {
          handleExpire()
        }
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [orderState, orderData])

  // 3. Firestore Real-time Subscription
  useEffect(() => {
    if (orderState !== 'active' || !orderData) return
    
    const unsubscribe = onSnapshot(doc(db, 'pendingPayments', orderData.orderId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        if (data.status === 'paid') {
          setOrderState('paid')
          // Auto-advance
          onSubmit({ orderId: data.orderId, paymentId: data.paymentId })
        } else if (data.status === 'expired' || data.status === 'failed') {
          setOrderState('expired')
        }
      }
    })
    return () => unsubscribe()
  }, [orderState, orderData, onSubmit])

  // 4. Manual/Timer Expiry call
  const handleExpire = async () => {
    setOrderState('expired')
    try {
      const expireOrder = httpsCallable(functions, 'expireOrder')
      await expireOrder({ orderId: orderData.orderId })
    } catch (e) {
      console.error('Failed to expire order explicitly:', e)
    }
  }

  return (
    <div className="reg-form">
      <h3 className="reg-step-title">Payment</h3>

      <div className="payment-summary">
        <div className="payment-summary-row">
          <span>Event</span>
          <strong>{config.name}</strong>
        </div>
        <div className="payment-summary-row">
          <span>Team</span>
          <strong>{teamName || '—'}</strong>
        </div>
        <div className="payment-summary-row payment-summary-total">
          <span>Amount</span>
          <strong>₹{config.entryFee}</strong>
        </div>
      </div>

      {(orderState === 'initial' || orderState === 'creating' || orderState === 'error') && (
        <div className="payment-unlock-wrap" style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
            Ready to pay? Generate a unique payment QR code. You will have 5 minutes to complete the transaction.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUnlock}
            disabled={orderState === 'creating'}
          >
            {orderState === 'creating' ? (
              <><span className="reg-spinner" aria-hidden="true" /> Generating…</>
            ) : (
              'Unlock Payment QR 🔒'
            )}
          </button>
          {errorMsg && <p className="reg-error" style={{ marginTop: 16 }}>{errorMsg}</p>}
        </div>
      )}

      {orderState === 'active' && orderData && (
        <>
          <div className="payment-active-box" style={{ textAlign: 'center', marginTop: 24 }}>
            <div className={`countdown ${timeLeft < 60 ? 'countdown-urgent' : ''}`} style={{
              fontSize: '2rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              color: timeLeft < 60 ? '#ef4444' : 'var(--accent)',
              marginBottom: 16
            }}>
              {formatTime(timeLeft)}
            </div>

            <div className="payment-qr-wrap" style={{ display: 'inline-block', background: '#fff', padding: 12, borderRadius: 12, margin: '0 auto 16px' }}>
              <QRCodeSVG value={orderData.upiIntentLink} size={200} />
            </div>

            {isMobileDevice() ? (
              <a href={orderData.upiIntentLink} className="btn btn-primary reg-upi-btn" style={{ width: '100%', marginBottom: 12 }}>
                📱 Pay ₹{orderData.amountINR} via UPI App
              </a>
            ) : (
              <p className="payment-desktop-note">
                💻 Scan the QR code using your phone's UPI app. Keep this tab open.
              </p>
            )}
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 12 }}>
              Waiting for confirmation from gateway... Do not close this window.
            </p>
          </div>
        </>
      )}

      {orderState === 'expired' && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: '#ef4444', marginBottom: 16 }}>Payment window expired or failed.</p>
          <button type="button" className="btn btn-primary" onClick={() => setOrderState('initial')}>
            Try Again ↻
          </button>
        </div>
      )}

      <div className="reg-footer-actions" style={{ marginTop: 24 }}>
        <button type="button" className="btn btn-ghost" onClick={onBack} disabled={orderState === 'creating' || orderState === 'active'}>
          ← Back to Details
        </button>
      </div>
    </div>
  )
}
