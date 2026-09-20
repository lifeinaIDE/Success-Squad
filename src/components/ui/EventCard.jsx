import { Link } from 'react-router-dom'

/**
 * EventCard — upcoming event card. highlight prop adds the accent border treatment.
 */
export default function EventCard({ tag, date, title, description, meta = [], btnLabel, btnClass, highlight = false }) {
  return (
    <div className={`event-card${highlight ? ' highlight-card' : ''}`}>
      <div className="event-card-tag">{tag}</div>
      <div className="event-card-date">{date}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {meta.length > 0 && (
        <div className="event-card-meta">
          {meta.map((m) => <span key={m}>{m}</span>)}
        </div>
      )}
      <Link to="/contact" className={btnClass} style={{ marginTop: '20px' }}>{btnLabel}</Link>
    </div>
  )
}
