/**
 * UnstopDirectModal.jsx
 *
 * A lightweight modal shown when a user clicks "Register Now" on CraftCode.
 * It prompts them to register on Unstop first, with a clear CTA link.
 * No multi-step form — just the message + link.
 */

import { useEffect, useRef } from 'react'

export default function UnstopDirectModal({ config, isOpen, onClose }) {
  const closeRef = useRef(null)

  useEffect(() => {
    if (isOpen) setTimeout(() => closeRef.current?.focus(), 50)
  }, [isOpen])

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape' && isOpen) onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen || !config) return null

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="unstop-modal-title"
        className="modal-sheet"
        style={{ maxWidth: 480 }}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 id="unstop-modal-title" className="modal-title">
              {config.name} <span className="modal-event-tag">E-Fest '26</span>
            </h2>
            <p className="modal-sub">External Registration via Unstop</p>
          </div>
          <button
            ref={closeRef}
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '24px 0 8px' }}>

          {/* Info badge */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 12,
            padding: '18px 20px',
            marginBottom: 28,
          }}>
            <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>🚀</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>
                CraftCode is hosted on Unstop
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                Registrations for CraftCode are managed entirely on{' '}
                <strong style={{ color: '#fff' }}>Unstop</strong>. Click the button
                below to open the official Unstop page, complete your registration,
                and pay the entry fee of{' '}
                <strong style={{ color: 'var(--accent)' }}>₹{config.entryFee}</strong> there.
              </p>
            </div>
          </div>

          {/* Steps */}
          <ol style={{
            paddingLeft: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginBottom: 32,
          }}>
            {[
              'Click "Register on Unstop" below',
              'Create / log in to your Unstop account',
              'Complete the registration form and pay ₹' + config.entryFee,
              'Save your Unstop Registration ID — you may need it later',
            ].map((step, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{
                  flexShrink: 0,
                  width: 26, height: 26,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.78rem',
                }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.55, paddingTop: 2 }}>
                  {step}
                </span>
              </li>
            ))}
          </ol>

          {/* Primary CTA */}
          <a
            href={config.unstopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            id="unstop-direct-register-btn"
            style={{ display: 'block', width: '100%', textAlign: 'center', marginBottom: 14 }}
            onClick={onClose}
          >
            Register on Unstop →
          </a>

          {/* Entry fee + team-size note */}
          <p style={{
            textAlign: 'center',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            marginBottom: 4,
          }}>
            Entry fee: ₹{config.entryFee} · Team size: up to {config.teamSize} members
          </p>

          <button
            className="btn btn-ghost"
            onClick={onClose}
            style={{ display: 'block', width: '100%', marginTop: 8 }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
