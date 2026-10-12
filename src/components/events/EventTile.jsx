/**
 * EventTile.jsx - Reusable event card for the RegistrationHub grid.
 * comingSoon:true → disabled "Coming Soon" button state.
 * comingSoon:false → active "Register Now" button triggers onRegister().
 */
export default function EventTile({ event, onRegister, isClosed = false }) {
  const isTileDisabled = event.comingSoon || isClosed

  return (
    <div className={`event-tile event-card${isTileDisabled ? ' event-tile--soon' : ' highlight-card'}`}>
      <div className="event-tile-top">
        <span className="event-card-tag">
          {isClosed ? 'Closed' : event.comingSoon ? 'Coming Soon' : 'Open'}
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
