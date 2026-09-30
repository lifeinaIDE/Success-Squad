/**
 * EventTile.jsx — Reusable event card for the RegistrationHub grid.
 * comingSoon:true → disabled "Coming Soon" button state.
 * comingSoon:false → active "Register Now" button triggers onRegister().
 */
export default function EventTile({ event, onRegister }) {
  return (
    <div className={`event-tile event-card${event.comingSoon ? ' event-tile--soon' : ' highlight-card'}`}>
      <div className="event-tile-top">
        <span className="event-card-tag">
          {event.comingSoon ? 'Coming Soon' : 'Open'}
        </span>
      </div>
      <h3 className="event-tile-name">{event.name}</h3>
      <p className="event-tile-tagline">{event.tagline}</p>
      <div className="event-tile-footer">
        {event.comingSoon ? (
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
