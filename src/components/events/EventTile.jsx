/**
 * EventTile.jsx - Reusable event card for the RegistrationHub grid.
 * comingSoon:true → disabled "Coming Soon" button.
 * registrationType === 'external-unstop' → shows "Register on Unstop →" badge.
 */
export default function EventTile({ event, onRegister, isClosed = false }) {
  const isTileDisabled  = event.comingSoon || isClosed
  const isUnstop        = event.registrationType === 'external-unstop'
  const isIndividual    = event.registrationType === 'individual'

  return (
    <div className={`event-tile event-card${isTileDisabled ? ' event-tile--soon' : ' highlight-card'}`}>
      <div className="event-tile-top">
        <span className="event-card-tag">
          {isClosed ? 'Closed' : event.comingSoon ? 'Coming Soon' : isUnstop ? 'Unstop' : 'Open'}
        </span>
        <span style={{
          fontSize: '0.78rem',
          fontWeight: 700,
          color: 'var(--accent)',
          background: 'rgba(99,102,241,0.12)',
          borderRadius: 6,
          padding: '2px 8px',
        }}>
          ₹{event.entryFee}{isIndividual ? '/person' : '/team'}
        </span>
      </div>
      <h3 className="event-tile-name">{event.name}</h3>
      <p className="event-tile-tagline">{event.tagline}</p>
      <div className="event-tile-footer">
        {isClosed ? (
          <button
            className="btn btn-disabled"
            disabled
            aria-disabled="true"
            id={`tile-${event.id}-closed`}
            aria-label={`Registrations closed for ${event.name}`}
          >
            Registrations Closed
          </button>
        ) : event.comingSoon ? (
          <button className="btn btn-ghost" disabled aria-disabled="true" id={`tile-${event.id}-soon`}>
            Coming Soon
          </button>
        ) : isUnstop ? (
          <button
            className="btn btn-primary"
            onClick={onRegister}
            id={`tile-${event.id}-register`}
            aria-label={`Register for ${event.name} on Unstop`}
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            Register via Unstop →
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={onRegister}
            id={`tile-${event.id}-register`}
            aria-label={`Register for ${event.name}`}
          >
            Register Now →
          </button>
        )}
      </div>
    </div>
  )
}
