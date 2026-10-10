/**
 * CraftCodeRegistration.jsx
 *
 * Two-section Unstop registration flow for CraftCode (external event).
 *
 * SECTION A — "Register on Unstop"
 *   Collects: Unstop Registration ID + screenshot of Unstop confirmation.
 *   On submit → writes a pending_payments row with status 'pending_unstop_review'.
 *   This status counts toward slot capacity (same as 'submitted' elsewhere).
 *
 * SECTION B — "Download Receipt" (locked until Section A succeeds)
 *   Shows locked state until Section A resolves.
 *   Once admin marks the row 'verified', the receipt becomes downloadable.
 *
 * TODO (payment): Does CraftCode collect a separate Success Squad fee?
 *   - DEFAULT: NO — Unstop handles all payment. hasSeparateFee: false.
 *   - If YES: set hasSeparateFee: true in eventConfigs.js for 'craftcode'.
 *     Section B will then show PaymentStep inside it before receipt unlock.
 *
 * Admin review: these items appear in the admin queue tagged as
 * "CraftCode — Unstop verification" with status 'pending_unstop_review'.
 */

import { useState, useRef } from 'react'
import { generateReceipt, printReceipt } from '../../utils/generateReceipt.js'
import { supabase } from '../../services/supabase.js'

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function validateImage(file) {
  if (!file) return 'Please select a screenshot.'
  if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPG, PNG, WebP, or GIF images are accepted.'
  if (file.size > MAX_SIZE_BYTES) return 'Image must be under 5 MB.'
  return null
}

// ── Section A ────────────────────────────────────────────────────────────────
function SectionA({ config, teamData, onSuccess }) {
  const [unstopId, setUnstopId] = useState('')
  const [file, setFile]         = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [phase, setPhase]       = useState('idle') // idle | submitting | done | error
  const [error, setError]       = useState('')
  const fileRef = useRef(null)

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    const err = validateImage(f)
    if (err) { setError(err); return }
    setFile(f)
    setError('')
    const reader = new FileReader()
    reader.onloadend = () => setPreviewUrl(reader.result)
    reader.readAsDataURL(f)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!unstopId.trim()) { setError('Unstop Registration ID is required.'); return }
    const imgErr = validateImage(file)
    if (imgErr) { setError(imgErr); return }

    setPhase('submitting')
    try {
      if (!supabase) {
        throw new Error('Database service is not configured. Missing Supabase environment variables.')
      }

      // 1. Upload screenshot to Supabase Storage
      const safeName = (file?.name || 'unstop_proof.png').replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `unstop-proofs/${config.id}/${Date.now()}_${safeName}`
      const { error: uploadErr } = await supabase.storage
        .from('payment-proofs')
        .upload(path, file, { upsert: true })
      if (uploadErr) throw uploadErr

      const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(path)
      const screenshotUrl = urlData.publicUrl

      // 2. Generate order_id
      const orderId = 'CRAFT_' + Math.random().toString(36).slice(2, 10).toUpperCase()

      // 3. Insert pending_payments with status 'pending_unstop_review'
      //    This counts toward slot capacity (same logic as 'submitted')
      const { error: insertErr } = await supabase
        .from('pending_payments')
        .insert({
          order_id:       orderId,
          event_id:       config.id,
          team_data:      teamData,
          amount_inr:     config.entryFee,
          status:         'pending_unstop_review',
          utr:            unstopId.trim(),   // reuse utr column to store Unstop registration ID
          screenshot_url: screenshotUrl,
          expires_at:     null,              // no expiry for Unstop flow
        })
      if (insertErr) throw insertErr

      setPhase('done')
      onSuccess({ orderId, unstopId: unstopId.trim() })
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Submission failed. Please try again.')
      setPhase('idle')
    }
  }

  if (phase === 'done') {
    return (
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
        <p style={{ color: '#10b981', fontWeight: 600 }}>Unstop registration submitted for review!</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
          Our team will verify your Unstop ID and unlock your receipt shortly.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Unstop link */}
      <div style={{ marginBottom: 20, padding: '16px', background: 'rgba(99,102,241,0.08)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.25)' }}>
        <p style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--text-muted)' }}>
          CraftCode is hosted on Unstop. Complete your registration there first, then confirm below.
        </p>
        <a
          href={config.unstopUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          id="craftcode-unstop-link"
          style={{ display: 'inline-block' }}
        >
          Register on Unstop →
        </a>
      </div>

      <div className="form-group">
        <label htmlFor="unstop-reg-id">
          Unstop Registration ID <span aria-hidden="true">*</span>
        </label>
        <input
          id="unstop-reg-id"
          type="text"
          placeholder="e.g. UST-123456789"
          value={unstopId}
          onChange={(e) => setUnstopId(e.target.value)}
          required
          disabled={phase === 'submitting'}
          className="form-input"
        />
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
          Found in your Unstop dashboard under "My Registrations".
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="unstop-screenshot">
          Unstop Confirmation Screenshot <span aria-hidden="true">*</span>
        </label>
        <input
          ref={fileRef}
          id="unstop-screenshot"
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

      {error && <p className="reg-error" role="alert" style={{ marginBottom: 12 }}>{error}</p>}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={phase === 'submitting'}
        id="craftcode-confirm-unstop-btn"
        style={{ width: '100%' }}
      >
        {phase === 'submitting'
          ? <><span className="reg-spinner" aria-hidden="true" /> Submitting…</>
          : 'Confirm Unstop Registration'}
      </button>
    </form>
  )
}

// ── Section B ────────────────────────────────────────────────────────────────
function SectionB({ config, reg, isUnlocked }) {
  const [downloading, setDownloading] = useState(false)
  const [printing, setPrinting]       = useState(false)
  const [dlError, setDlError]         = useState('')

  const isVerified = reg?.status === 'verified' || reg?.status === 'confirmed' || reg?.payment_status === 'PAID'

  const handleDownload = async () => {
    if (!isVerified) {
      setDlError('Receipts can only be generated after submission is verified.')
      return
    }
    setDownloading(true)
    setDlError('')
    try {
      await generateReceipt({
        team_id:     reg?.team_id || reg?.order_id || 'CRAFT-VERIFIED',
        event_id:    config.id,
        team_data:   reg?.team_data,
        amount_inr:  config.entryFee,
        utr:         reg?.utr,
        verified_at: reg?.verified_at || new Date().toISOString(),
        status:      'verified',
      })
    } catch (err) {
      setDlError(err.message || 'Failed to generate receipt. Try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handlePrint = async () => {
    if (!isVerified) {
      setDlError('Receipts can only be printed after submission is verified.')
      return
    }
    setPrinting(true)
    setDlError('')
    try {
      await printReceipt({
        team_id:     reg?.team_id || reg?.order_id || 'CRAFT-VERIFIED',
        event_id:    config.id,
        team_data:   reg?.team_data,
        amount_inr:  config.entryFee,
        utr:         reg?.utr,
        verified_at: reg?.verified_at || new Date().toISOString(),
        status:      'verified',
      })
    } catch (err) {
      setDlError(err.message || 'Failed to prepare print preview.')
    } finally {
      setPrinting(false)
    }
  }

  if (!isUnlocked) {
    return (
      <div style={{
        padding: '24px',
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.02)',
        textAlign: 'center',
        opacity: 0.6,
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>🔒</div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Complete Unstop registration above to unlock
        </p>
      </div>
    )
  }

  if (!isVerified) {
    return (
      <div style={{
        padding: '24px',
        borderRadius: 12,
        border: '1px solid rgba(99,102,241,0.3)',
        background: 'rgba(99,102,241,0.05)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>⏳</div>
        <p style={{ fontWeight: 600, marginBottom: 4, color: '#a5b4fc' }}>Unstop Submission Received!</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 6 }}>
          Your Unstop ID and proof have been recorded. In accordance with fest regulations, official PAID receipts are unlocked once verified.
        </p>
      </div>
    )
  }

  return (
    <div style={{
      padding: '24px',
      borderRadius: 12,
      border: '1px solid rgba(16,185,129,0.3)',
      background: 'rgba(16,185,129,0.05)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>🎉</div>
      <p style={{ fontWeight: 600, marginBottom: 12, color: '#10b981' }}>Verified! Official Receipt Ready.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button
          className="btn btn-primary"
          onClick={handleDownload}
          disabled={downloading}
          id="craftcode-download-receipt-btn"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)', justifyContent: 'center' }}
        >
          {downloading ? 'Generating…' : '⬇ Download PDF'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={handlePrint}
          disabled={printing}
          id="craftcode-print-receipt-btn"
          style={{ justifyContent: 'center' }}
        >
          {printing ? 'Preparing…' : '🖨️ Print Receipt'}
        </button>
      </div>
      {dlError && <p className="reg-error" style={{ marginTop: 8 }}>{dlError}</p>}
    </div>
  )
}


// ── Main export ───────────────────────────────────────────────────────────────
export default function CraftCodeRegistration({ config, teamData, onClose }) {
  const [sectionADone, setSectionADone] = useState(false)
  const [sectionAResult, setSectionAResult] = useState(null) // { orderId, unstopId }

  const handleSectionASuccess = (result) => {
    setSectionAResult(result)
    setSectionADone(true)
  }

  return (
    <div className="reg-form">
      {/* ── SECTION A ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: sectionADone ? '#10b981' : 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.85rem', flexShrink: 0,
          }}>
            {sectionADone ? '✓' : 'A'}
          </div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Register on Unstop</h3>
        </div>
        <SectionA
          config={config}
          teamData={teamData}
          onSuccess={handleSectionASuccess}
        />
      </div>

      <div style={{ borderTop: '1px solid var(--border)', margin: '0 0 28px' }} />

      {/* ── SECTION B ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: sectionADone ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.85rem', flexShrink: 0,
          }}>
            B
          </div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: sectionADone ? 'inherit' : 'var(--text-muted)' }}>
            Download Receipt
          </h3>
        </div>
        <SectionB
          config={config}
          reg={{ ...(sectionAResult || {}), team_data: teamData }}
          isUnlocked={sectionADone}
        />
      </div>

      <div className="reg-footer-actions" style={{ marginTop: 32, justifyContent: 'center' }}>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
