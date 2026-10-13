/**
 * RegistrationModal - multi-event registration modal.
 *
 * Flow by registrationType:
 *
 *   'team' (default):
 *     Step 1 → TeamDetailsStep  (team info)
 *     Step 2 → PaymentStep      (UPI QR + screenshot + Transaction ID)
 *     Step 3 → ConfirmationStep (pending verification)
 *
 *   'individual' (e.g. Illuminate Workshop):
 *     Step 1 → IndividualDetailsStep (personal info)
 *     Step 2 → PaymentStep
 *     Step 3 → ConfirmationStep
 *
 *   'external-unstop' (CraftCode):
 *     Handled by UnstopDirectModal in RegistrationHub — this modal
 *     is never opened for external-unstop events.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { eventConfigs }            from '../../data/eventConfigs.js'
import TeamDetailsStep             from './steps/TeamDetailsStep.jsx'
import IndividualDetailsStep       from './steps/IndividualDetailsStep.jsx'
import PaymentStep                 from './steps/PaymentStep.jsx'
import ConfirmationStep            from './steps/ConfirmationStep.jsx'
import { isRegistrationClosed }    from './FlipCountdown.jsx'

const STEPS = ['Details', 'Payment', 'Confirmation']

export default function RegistrationModal({ eventId, isOpen, onClose }) {
  const config = eventConfigs[eventId]

  const isIndividual = config?.registrationType === 'individual'

  const [step, setStep]                   = useState(0)
  const [formData, setFormData]           = useState(null)
  const [paymentResult, setPaymentResult] = useState(null)

  const dialogRef = useRef(null)
  const closeRef  = useRef(null)

  // ── Reset state on open/close ────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setStep(0)
      setFormData(null)
      setPaymentResult(null)
      setTimeout(() => closeRef.current?.focus(), 50)
    }
  }, [isOpen])

  // ── Escape key ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape' && isOpen) onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // ── Focus trap ──────────────────────────────────────────────────────────
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
        if (document.activeElement === last)  { e.preventDefault(); first?.focus() }
      }
    }
    dialog.addEventListener('keydown', trap)
    return () => dialog.removeEventListener('keydown', trap)
  }, [isOpen, step])

  // ── Body scroll lock ────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // ── Step handlers ───────────────────────────────────────────────────────
  const handleDetailsSubmit = useCallback((data) => {
    if (isRegistrationClosed()) {
      alert("Registrations for E-Fest '26 closed on 26 Oct, 12:00 PM IST.")
      return
    }
    setFormData(data)
    setStep(1)
  }, [])

  const handlePaymentSubmit = useCallback((result) => {
    if (isRegistrationClosed()) {
      alert("Registrations for E-Fest '26 closed on 26 Oct, 12:00 PM IST.")
      return
    }
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
            <p id="modal-desc" className="modal-sub">
              {isIndividual ? 'Individual Registration' : 'Team Registration'}
            </p>
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

        {/* Progress indicator */}
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
          {/* Step 0 — Details (team or individual) */}
          {step === 0 && (
            isIndividual ? (
              <IndividualDetailsStep
                config={config}
                initialData={formData}
                onSubmit={handleDetailsSubmit}
              />
            ) : (
              <TeamDetailsStep
                config={config}
                initialData={formData}
                onSubmit={handleDetailsSubmit}
              />
            )
          )}

          {/* Step 1 — Payment */}
          {step === 1 && (
            <PaymentStep
              config={config}
              teamName={formData?.teamName ?? formData?.leaderName ?? ''}
              formData={formData}
              onSubmit={handlePaymentSubmit}
              onBack={() => setStep(0)}
            />
          )}

          {/* Step 2 — Confirmation */}
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
