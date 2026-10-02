/**
 * ConfirmationStep — Step 3 of RegistrationModal (Manual Verification).
 *
 * Triggered automatically when PaymentStep submits proof. At this point:
 *  1. The row is in 'submitted' state in pending_payments.
 *  2. Registration row is NOT yet created (no Team ID yet).
 *  3. Display "Pending Verification" message and order ID.
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPendingPaymentByOrderId } from '../../../services/registrations.js'

export default function ConfirmationStep({ config, formData, paymentResult, onClose }) {
  // paymentResult = { orderId } — passed from PaymentStep via onSubmit
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!paymentResult?.orderId) return
    let mounted = true

    const fetch = async () => {
      try {
        const data = await getPendingPaymentByOrderId(paymentResult.orderId)
        if (mounted) {
          if (data) {
            setOrder(data)
          } else {
            setError('Failed to load submitted payment details.')
          }
        }
      } catch (err) {
        if (mounted) setError('Failed to load submitted payment details: ' + err.message)
      }
    }
    fetch()

    return () => { mounted = false }
  }, [paymentResult])

  if (error) {
    return (
      <div className="reg-confirmation">
        <p className="reg-error" style={{ fontSize: '0.95rem', maxWidth: 400 }}>{error}</p>
        <button className="btn btn-ghost" style={{ marginTop: 24 }} onClick={onClose}>Close</button>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="reg-confirmation" style={{ padding: '60px 0', gap: 16 }}>
        <span className="reg-spinner" style={{ width: 32, height: 32, borderWidth: 3 }} aria-label="Loading" />
        <p style={{ color: 'var(--text-muted)' }}>Loading confirmation details…</p>
      </div>
    )
  }

  const teamName    = order.team_data?.teamName ?? formData?.teamName ?? '—'
  const submittedAt = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  return (
    <div className="reg-confirmation" aria-live="polite">
      <div className="reg-confirmation-icon" aria-hidden="true" style={{ fontSize: '3rem', marginBottom: 12 }}>⏳</div>
      <h3 className="reg-step-title">Submitted — Pending Verification</h3>
      
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
        Your payment proof has been submitted. Our team will verify your UTR against the bank statement shortly.
      </p>

      {/* Order ID */}
      <div className="reg-teamid-box" aria-label={`Your Order ID is ${order.order_id}`}>
        <span className="reg-teamid-label">Your Order ID (Save this)</span>
        <span className="reg-teamid-value" id="confirmed-order-id" style={{ fontSize: '1.2rem' }}>{order.order_id}</span>
        <button
          className="reg-teamid-copy btn btn-ghost"
          onClick={() => navigator.clipboard?.writeText(order.order_id)}
          aria-label="Copy Order ID to clipboard"
        >
          Copy
        </button>
      </div>

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
          Payment Details
        </p>

        {[
          ['Team Name',  teamName],
          ['Event',      config.name],
          ['Amount',     `₹${order.amount_inr}`],
          ['UTR',        order.utr],
          ['Date',       submittedAt],
        ].map(([label, value]) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between',
            marginBottom: 10, fontSize: '0.88rem',
          }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <strong style={{ maxWidth: '60%', textAlign: 'right', wordBreak: 'break-all' }}>
              {value}
            </strong>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, width: '100%' }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 10, textAlign: 'center' }}>
          Check your registration status later to get your official <strong>Team ID</strong> and receipt once verified.
        </p>
      </div>

      <div className="reg-footer-actions" style={{ marginTop: 32, justifyContent: 'center', width: '100%' }}>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
        <Link to="/status" className="btn btn-primary" onClick={onClose} id="view-status-link">
          Check Status →
        </Link>
      </div>
    </div>
  )
}
