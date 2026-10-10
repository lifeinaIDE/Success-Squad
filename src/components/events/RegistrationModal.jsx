/**
 * RegistrationModal — multi-event registration modal.
 *
 * Standard flow (all events except CraftCode):
 *   Step 1 → TeamDetailsStep  (team info + validation)
 *   Step 2 → PaymentStep      (static QR, screenshot + Transaction ID)
 *   Step 3 → ConfirmationStep (pending-verification screen)
 *
 * CraftCode flow (registrationType === 'external-unstop'):
 *   Skips the internal payment steps entirely.
 *   Renders CraftCodeRegistration (Section A: Unstop ID + screenshot;
 *   Section B: locked receipt download).
 *   TeamDetailsStep still runs first as Step 1 to collect leader/team info.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { eventConfigs }          from '../../data/eventConfigs.js'
import TeamDetailsStep           from './steps/TeamDetailsStep.jsx'
import PaymentStep               from './steps/PaymentStep.jsx'
import ConfirmationStep          from './steps/ConfirmationStep.jsx'
import CraftCodeRegistration     from './CraftCodeRegistration.jsx'

const STEPS_STANDARD  = ['Team Details', 'Payment', 'Confirmation']
const STEPS_CRAFTCODE = ['Team Details', 'Unstop Registration']

export default function RegistrationModal({ eventId, isOpen, onClose }) {
  const config = eventConfigs[eventId]

  const isExternal  = config?.registrationType === 'external-unstop'
  const STEPS       = isExternal ? STEPS_CRAFTCODE : STEPS_STANDARD

  const [step, setStep]                   = useState(0)
  const [formData, setFormData]           = useState(null)
  const [paymentResult, setPaymentResult] = useState(null)

  const dialogRef = useRef(null)
  const closeRef  = useRef(null)

  // ── Reset state on open/close ───────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setStep(0)
      setFormData(null)
      setPaymentResult(null)
      setTimeout(() => closeRef.current?.focus(), 50)
    }
  }, [isOpen])

  // ── Escape key to close ─────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
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
              {config.entryFee && (
                <span className="modal-fee-badge" aria-label={`Fee ₹${config.entryFee}`}>
                  ₹{config.entryFee}
                </span>
              )}
            </h2>
            <p id="modal-desc" className="modal-sub">
              {isExternal ? 'Unstop Registration' : `Registration Fee: ₹${config.entryFee} per team`}
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
          {/* Step 0 — Team Details (shared by all events) */}
          {step === 0 && (
            <TeamDetailsStep
              config={config}
              initialData={formData}
              onSubmit={handleTeamDetailsSubmit}
            />
          )}

          {/* Step 1 — branches on registrationType */}
          {step === 1 && isExternal && (
            // CraftCode: Unstop registration flow (Section A + B)
            <CraftCodeRegistration
              config={config}
              teamData={formData}
              onClose={onClose}
            />
          )}

          {step === 1 && !isExternal && (
            // Standard: Payment QR + proof upload
            <PaymentStep
              config={config}
              teamName={formData?.teamName ?? ''}
              formData={formData}
              onSubmit={handlePaymentSubmit}
              onBack={() => setStep(0)}
              onClose={onClose}
            />
          )}

          {/* Step 2 — standard confirmation only (CraftCode stays on step 1) */}
          {step === 2 && !isExternal && (
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
