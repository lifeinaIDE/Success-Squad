/**
 * EFestHero.jsx — Full-width flagship card for E-Fest '26.
 *
 * "Register Now" navigates (React Router internal link) to the hidden
 * registration hub route. The slug comes from VITE_FEST_SLUG env var;
 * falls back to 'e-fest-26' — matching the same default in App.jsx.
 */
import { Link } from 'react-router-dom'

const FEST_SLUG          = import.meta.env.VITE_FEST_SLUG || 'e-fest-26'
const HUB_PATH           = `/fest/${FEST_SLUG}`
const EFEST_EVENTS_COUNT = 6

export default function EFestHero() {
  return (
    <div className="efest-hero-card highlight-card event-card">
      <div className="efest-hero-inner">
        {/* ── LEFT: Content ── */}
        <div className="efest-hero-content">
          <div className="efest-hero-top">
            <span className="event-card-tag">Fest</span>
            <span className="event-card-date">September 2026</span>
          </div>

          <h2 className="efest-hero-title">E&#8209;Fest&nbsp;&#x27;26</h2>

          <p className="efest-hero-desc">
            Success Squad's flagship annual festival — six high-stakes competitions,
            one electrifying weekend. From BGMI battles to startup pitches, this is
            where campus energy peaks.
          </p>

          <div className="efest-hero-actions">
            {/* Use React Router Link so it works as a proper internal SPA navigation */}
            <Link
              id="efest-register-btn"
              to={HUB_PATH}
              className="btn btn-primary"
            >
              Register Now →
            </Link>
          </div>
        </div>

        {/* ── RIGHT: Stat counter ── */}
        <div className="efest-hero-stat" aria-label={`${EFEST_EVENTS_COUNT} Events`}>
          <span className="efest-stat-num">{EFEST_EVENTS_COUNT}</span>
          <span className="efest-stat-label">Events</span>
          <span className="efest-stat-sub">BGMI · FFLEC · Hackathon · IPL Auction · Pitch · MUN</span>
        </div>
      </div>
    </div>
  )
}
