/**
 * ConfirmationStep — Step 3 of RegistrationModal.
 *
 * Shows:
 *  - Team ID prominently (BGMI-XXXXX)
 *  - "Registration submitted — pending verification" message
 *  - Note about checking status via StatusLookup page
 *  - No wait for admin approval — they can close immediately
 */

import { Link } from 'react-router-dom'

export default function ConfirmationStep({ config, teamId, onClose }) {
  return (
    <div className="reg-confirmation" aria-live="polite">
      <div className="reg-confirmation-icon" aria-hidden="true">🎉</div>

      <h3 className="reg-step-title">Registration Submitted!</h3>

      <p className="reg-step-sub">
        Your registration for <strong>{config.name}</strong> is received and pending verification.
      </p>

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

      <p className="reg-confirmation-note">
        Save your Team ID — you'll need it to check verification status and download your receipt.
        Once verified by the team, you'll see the status updated on the lookup page.
      </p>

      <div className="reg-footer-actions" style={{ justifyContent: 'center' }}>
        <button className="btn btn-ghost" onClick={onClose}>
          Close
        </button>
        <Link
          to="/status"
          className="btn btn-primary"
          onClick={onClose}
          id="check-status-link"
        >
          Check Status →
        </Link>
      </div>
    </div>
  )
}
