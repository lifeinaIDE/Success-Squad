/**
 * RegistrationModal — generic 3-step registration modal.
 *
 * Driven entirely by the eventConfigs.js entry for the given eventId.
 * Adding a new event = extending eventConfigs, not touching this file.
 *
 * Step 1 → TeamDetailsStep  (team info + validation)
 * Step 2 → PaymentStep      (QR code + UPI deep link + screenshot upload)
 * Step 3 → ConfirmationStep (Team ID display + status note)
 *
 * Accessibility:
 *  - Focus trapped inside the modal while open
 *  - Closable via Escape or backdrop click
 *  - aria-labelledby, aria-describedby, aria-modal on the dialog
 *  - All inputs have associated <label>s
 *
 * Mobile: full-screen sheet via CSS .modal-sheet class.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { eventConfigs }     from '../../data/eventConfigs.js'
import TeamDetailsStep      from './steps/TeamDetailsStep.jsx'
import PaymentStep          from './steps/PaymentStep.jsx'
import ConfirmationStep     from './steps/ConfirmationStep.jsx'
import { createRegistration } from '../../services/registrations.js'

const STEPS = ['Team Details', 'Payment', 'Confirmation']

export default function RegistrationModal({ eventId, isOpen, onClose }) {
  const config = eventConfigs[eventId]

  const [step, setStep]             = useState(0)  // 0-based
  const [formData, setFormData]     = useState(null)
  const [screenshot, setScreenshot] = useState(null)
  const [teamId, setTeamId]         = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const dialogRef  = useRef(null)
  const closeRef   = useRef(null)

  // ── Reset state on open/close ───────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setStep(0)
      setFormData(null)
      setScreenshot(null)
      setTeamId('')
      setSubmitError('')
      setSubmitting(false)
      // Focus the close button when modal opens
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
  }, [isOpen, step])  // re-run when step changes so focusable list is fresh

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

  const handlePaymentSubmit = useCallback(async (file) => {
    setScreenshot(file)
    setSubmitError('')
    setSubmitting(true)

    try {
      const id = await createRegistration(eventId, formData, file)
      setTeamId(id)
      setStep(2)
    } catch (err) {
      console.error('Registration submission error:', err)
      setSubmitError(
        'Something went wrong while submitting. Please check your connection and try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }, [eventId, formData])

  if (!isOpen || !config) return null

  return (
    /* Backdrop — click outside to close */
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
        {/* ── Header ── */}
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

        {/* ── Progress bar ── */}
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

        {/* ── Step content ── */}
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
              submitting={submitting}
              submitError={submitError}
              onSubmit={handlePaymentSubmit}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <ConfirmationStep
              config={config}
              teamId={teamId}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  )
}
