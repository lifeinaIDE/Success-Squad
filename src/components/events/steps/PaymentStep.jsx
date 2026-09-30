/**
 * PaymentStep — Step 2 of RegistrationModal.
 *
 * Shows:
 *  - Order summary (event name, team name, amount)
 *  - QR code image for UPI scan
 *  - "Pay via UPI App" button: on mobile fires a upi:// deep link,
 *    on desktop shows a note that deep link won't work — scan the QR.
 *  - Screenshot upload with thumbnail preview + size/type validation
 *  - "Submit Payment Proof" disabled until valid file attached + not submitting
 */

import { useState, useRef } from 'react'

const MAX_SIZE_MB  = 5
const MAX_SIZE_B   = MAX_SIZE_MB * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
}

export default function PaymentStep({
  config,
  teamName,
  submitting,
  submitError,
  onSubmit,
  onBack,
}) {
  const [file, setFile]           = useState(null)
  const [preview, setPreview]     = useState(null)
  const [fileError, setFileError] = useState('')
  const fileInputRef = useRef(null)

  const handleFile = (selected) => {
    setFileError('')
    setFile(null)
    setPreview(null)
    if (!selected) return

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setFileError(`Unsupported file type. Please upload a JPG, PNG, or WebP image.`)
      return
    }
    if (selected.size > MAX_SIZE_B) {
      setFileError(`File too large (${(selected.size / 1024 / 1024).toFixed(1)} MB). Max allowed: ${MAX_SIZE_MB} MB.`)
      return
    }

    setFile(selected)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(selected)
  }

  const upiLink = `upi://pay?pa=${encodeURIComponent(config.upiId)}&pn=SuccessSquad&am=${config.entryFee}&tn=${encodeURIComponent(teamName + '-BGMI')}&cu=INR`

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!file) { setFileError('Please attach your payment screenshot.'); return }
    onSubmit(file)
  }

  return (
    <form className="reg-form" onSubmit={handleSubmit} noValidate>
      <h3 className="reg-step-title">Payment</h3>

      {/* Order summary */}
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

      {/* QR Code */}
      <div className="payment-qr-wrap">
        <p className="payment-qr-label">Scan QR to pay via UPI</p>
        <img
          src={config.qrCodeImage}
          alt={`UPI QR code for ${config.name} registration`}
          className="payment-qr-img"
          width="220"
          height="220"
        />
        <p className="payment-qr-upiid">UPI ID: <code>{config.upiId}</code></p>
      </div>

      {/* UPI Deep Link (mobile) / note (desktop) */}
      {isMobileDevice() ? (
        <a
          href={upiLink}
          className="btn btn-primary reg-upi-btn"
          id="upi-pay-btn"
        >
          📱 Pay ₹{config.entryFee} via UPI App
        </a>
      ) : (
        <p className="payment-desktop-note">
          💻 On desktop, please scan the QR code above using your UPI app on your phone.
        </p>
      )}

      {/* Screenshot upload */}
      <div className="form-group reg-upload-group">
        <label htmlFor="payment-screenshot">
          Payment Screenshot <span aria-hidden="true">*</span>
          <span className="reg-upload-hint"> (JPG, PNG, WebP — max {MAX_SIZE_MB} MB)</span>
        </label>

        <div
          className={`reg-upload-area ${file ? 'has-file' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Click to upload payment screenshot"
        >
          {preview ? (
            <img src={preview} alt="Payment screenshot preview" className="reg-upload-preview" />
          ) : (
            <span className="reg-upload-placeholder">
              📎 Click to attach screenshot
            </span>
          )}
        </div>

        <input
          ref={fileInputRef}
          id="payment-screenshot"
          type="file"
          accept="image/*"
          className="reg-upload-input-hidden"
          aria-describedby={fileError ? 'err-screenshot' : undefined}
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />

        {fileError && <span id="err-screenshot" className="reg-error" role="alert">{fileError}</span>}
      </div>

      {/* Network/upload error from parent */}
      {submitError && (
        <p className="reg-error reg-error-network" role="alert">{submitError}</p>
      )}

      <div className="reg-footer-actions">
        <button type="button" className="btn btn-ghost" onClick={onBack} disabled={submitting}>
          ← Back
        </button>
        <button
          type="submit"
          id="submit-payment-proof"
          className="btn btn-primary"
          disabled={!file || submitting}
        >
          {submitting ? (
            <><span className="reg-spinner" aria-hidden="true" /> Submitting…</>
          ) : (
            'Submit Payment Proof →'
          )}
        </button>
      </div>
    </form>
  )
}
