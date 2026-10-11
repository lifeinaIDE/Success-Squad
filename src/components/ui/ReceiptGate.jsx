import React, { useState } from 'react'
import { useReceiptDownload } from '../../hooks/useReceiptDownload'

export default function ReceiptGate({ registration, onDownloaded }) {
  const { downloadReceipt, downloading, error } = useReceiptDownload()
  const [verificationVal, setVerificationVal] = useState('')

  const handleDownload = async () => {
    if (!verificationVal) return
    const success = await downloadReceipt(registration.team_id, verificationVal)
    if (success) {
      onDownloaded()
    }
  }

  return (
    <div className="receipt-gate-overlay" style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--bg)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="receipt-gate-card" style={{
        background: 'var(--bg-card)',
        padding: '40px',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Registration Verified!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          Your registration for team <strong>{registration.team_id}</strong> is verified. 
          Download your official receipt to continue.
        </p>
        
        <div style={{ marginBottom: '24px', textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Enter Leader Email or Last 4 Digits of Phone to verify:
          </label>
          <input 
            type="text" 
            className="input-field"
            value={verificationVal}
            onChange={(e) => setVerificationVal(e.target.value)}
            placeholder="e.g., leader@email.com or 1234"
            disabled={downloading}
            style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)' }}
          />
        </div>

        {error && <div className="error-message" style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}
        
        <button 
          className="btn btn-primary"
          onClick={handleDownload}
          disabled={!verificationVal || downloading}
          style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
        >
          {downloading ? 'Generating...' : 'Download Receipt'}
        </button>
      </div>
    </div>
  )
}
