/**
 * EFestHero.jsx — Full-width flagship card for E-Fest '26.
 *
 * Replaces the old 3-card upcoming events grid in Events.jsx.
 * Uses existing CSS design tokens (--accent #6366f1, --bg-card,
 * btn btn-primary, event-card-tag pill style, stat-num/stat-label).
 *
 * The "Register Now" button opens the hidden registration hub in a new tab.
 * The hub URL is read from the VITE_FEST_SLUG env var so it's not
 * hardcoded anywhere in source.
 */

const HUB_URL = import.meta.env.VITE_FEST_SLUG
  ? `${window.location.origin}/fest/${import.meta.env.VITE_FEST_SLUG}`
  : '#'

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

          <h2 className="efest-hero-title">E&#8209;Fest&nbsp;'26</h2>

          <p className="efest-hero-desc">
            Success Squad's flagship annual festival — six high-stakes competitions,
            one electrifying weekend. From BGMI battles to startup pitches, this is
            where campus energy peaks.
          </p>

          <div className="efest-hero-actions">
            <a
              id="efest-register-btn"
              href={HUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Register Now ↗
            </a>
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
