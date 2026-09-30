/**
 * RegistrationModal — generic 3-step registration modal (Revised for Razorpay).
 *
 * Step 1 → TeamDetailsStep  (team info + validation)
 * Step 2 → PaymentStep      (Cloud Function order creation, dynamic QR, real-time sync)
 * Step 3 → ConfirmationStep (Finalizing doc + optional screenshot)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { eventConfigs }     from '../../data/eventConfigs.js'
import TeamDetailsStep      from './steps/TeamDetailsStep.jsx'
import PaymentStep          from './steps/PaymentStep.jsx'
import ConfirmationStep     from './steps/ConfirmationStep.jsx'

const STEPS = ['Team Details', 'Payment', 'Confirmation']

export default function RegistrationModal({ eventId, isOpen, onClose }) {
  const config = eventConfigs[eventId]

  const [step, setStep]             = useState(0)  // 0-based
  const [formData, setFormData]     = useState(null)
  const [paymentResult, setPaymentResult] = useState(null)

  const dialogRef  = useRef(null)
  const closeRef   = useRef(null)

  // ── Reset state on open/close ───────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setStep(0)
      setFormData(null)
      setPaymentResult(null)
      // Focus the close button when modal opens
      setTimeout(() => closeRef.current?.focus(), 50)
    }
  }, [isOpen])

  // ── Escape key to close ─────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      // Don't allow closing with escape during payment processing or confirmation 
      // unless we want to, but it's safer to let them close it if they want.
      // Actually, let's allow it but maybe warn if payment active? For now just allow.
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // ── Focus trap ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    const dialog = dialogRef.current
    if (!dialog) return
    const focusable = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last  = focusable[focusable.length - 1]

    const trap = (e) => {
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }
    dialog.addEventListener('keydown', trap)
    return () => dialog.removeEventListener('keydown', trap)
  }, [isOpen, step])

  // ── Prevent body scroll while open ─────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // ── Step handlers ───────────────────────────────────────────────────────
  const handleTeamDetailsSubmit = useCallback((data) => {
    setFormData(data)
    setStep(1)
  }, [])

  const handlePaymentSubmit = useCallback((result) => {
    // result = { orderId, paymentId }
    setPaymentResult(result)
    setStep(2)
  }, [])

  if (!isOpen || !config) return null

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      aria-hidden="false"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-desc"
        className="modal-sheet"
      >
        <div className="modal-header">
          <div>
            <h2 id="modal-title" className="modal-title">
              {config.name} <span className="modal-event-tag">E-Fest '26</span>
            </h2>
            <p id="modal-desc" className="modal-sub">Registration</p>
          </div>
          <button
            ref={closeRef}
            className="modal-close"
            onClick={onClose}
            aria-label="Close registration modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-progress" aria-label="Registration progress">
          {STEPS.map((label, i) => (
            <div key={label} className={`modal-step ${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <div className="modal-step-dot">
                {i < step ? '✓' : i + 1}
              </div>
              <span className="modal-step-label">{label}</span>
            </div>
          ))}
        </div>

        <div className="modal-body">
          {step === 0 && (
            <TeamDetailsStep
              config={config}
              initialData={formData}
              onSubmit={handleTeamDetailsSubmit}
            />
          )}
          {step === 1 && (
            <PaymentStep
              config={config}
              teamName={formData?.teamName ?? ''}
              formData={formData}
              onSubmit={handlePaymentSubmit}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <ConfirmationStep
              config={config}
              formData={formData}
              paymentResult={paymentResult}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  )
}
