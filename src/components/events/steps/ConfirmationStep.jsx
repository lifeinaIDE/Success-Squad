/**
 * ConfirmationStep — Step 3 of RegistrationModal (Revised).
 *
 * Flow:
 *  - On mount, calls createConfirmedRegistration to get the unique Team ID.
 *  - Displays Team ID prominently.
 *  - Renders ReceiptPlaceholder.
 *  - Offers an optional screenshot upload (just updates the doc with screenshotUrl).
 */

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { createConfirmedRegistration, uploadScreenshotProof } from '../../../services/registrations.js'

export default function ConfirmationStep({ config, formData, paymentResult, onClose }) {
  const [teamId, setTeamId] = useState(null)
  const [error, setError] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!formData || !paymentResult) return
    let mounted = true
    
    // Create the final registration doc
    createConfirmedRegistration(config.id, formData, paymentResult.orderId, paymentResult.paymentId)
      .then(id => {
        if (mounted) setTeamId(id)
      })
      .catch(err => {
        console.error(err)
        if (mounted) setError('Payment was successful, but failed to generate Team ID. Please contact support with your Payment ID: ' + paymentResult.paymentId)
      })
      
    return () => { mounted = false }
  }, [config.id, formData, paymentResult])

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !teamId) return
    
    setUploading(true)
    try {
      await uploadScreenshotProof(teamId, config.id, file)
      setScreenshot(file)
      setUploaded(true)
    } catch (err) {
      console.error(err)
      alert('Failed to upload screenshot. Not required, so you can ignore this.')
    } finally {
      setUploading(false)
    }
  }

  if (error) {
    return (
      <div className="reg-confirmation">
        <p className="reg-error" style={{ fontSize: '1rem' }}>{error}</p>
      </div>
    )
  }

  if (!teamId) {
    return (
      <div className="reg-confirmation" style={{ padding: '60px 0' }}>
        <span className="reg-spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Finalizing registration...</p>
      </div>
    )
  }

  return (
    <div className="reg-confirmation" aria-live="polite">
      <div className="reg-confirmation-icon" aria-hidden="true">🎉</div>

      <h3 className="reg-step-title">Registration Confirmed!</h3>

      <div className="reg-teamid-box" aria-label={`Your Team ID is ${teamId}`}>
        <span className="reg-teamid-label">Your Team ID</span>
        <span className="reg-teamid-value" id="confirmed-team-id">{teamId}</span>
        <button
          className="reg-teamid-copy btn btn-ghost"
          onClick={() => navigator.clipboard?.writeText(teamId)}
          aria-label="Copy Team ID to clipboard"
        >
          Copy
        </button>
      </div>

      <div style={{ marginTop: 24, textAlign: 'left', width: '100%', background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
        <h4 style={{ marginBottom: 12, fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Payment Receipt</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Event:</span> <strong>{config.name}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Team:</span> <strong>{formData.teamName}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Amount Paid:</span> <strong>₹{config.entryFee}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Payment ID:</span> 
          <code style={{ fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: 4 }}>{paymentResult.paymentId}</code>
        </div>
      </div>

      <div style={{ marginTop: 24, width: '100%', textAlign: 'left' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          <strong>Optional:</strong> Attach your payment screenshot for your own records. This is not required — your payment is already verified.
        </p>
        
        {!uploaded ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button 
              className="btn btn-ghost" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              {uploading ? 'Uploading...' : '📎 Attach Screenshot'}
            </button>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handleFile} 
            />
          </div>
        ) : (
          <p style={{ color: '#22c55e', fontSize: '0.85rem' }}>✅ Screenshot attached.</p>
        )}
      </div>

      <div className="reg-footer-actions" style={{ justifyContent: 'center', width: '100%', marginTop: 32 }}>
        <button className="btn btn-ghost" onClick={onClose}>
          Close
        </button>
        <Link
          to="/status"
          className="btn btn-primary"
          onClick={onClose}
          id="check-status-link"
        >
          View Dashboard →
        </Link>
      </div>
    </div>
  )
}
