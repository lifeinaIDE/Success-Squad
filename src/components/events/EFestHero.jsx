/**
 * EFestHero.jsx - Full-width flagship card for E-Fest '26.
 *
 * "Register Now" navigates (React Router internal link) to the hidden
 * registration hub route. The slug comes from VITE_FEST_SLUG env var;
 * falls back to 'e-fest-26' - matching the same default in App.jsx.
 */
import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import FlipCountdown, {
  REGISTRATION_DEADLINE,
  isRegistrationClosed,
} from './FlipCountdown.jsx'

const FEST_SLUG          = import.meta.env.VITE_FEST_SLUG || 'e-fest-26'
const HUB_PATH           = `/fest/${FEST_SLUG}`
const EFEST_EVENTS_COUNT = 6

/**
 * NOTE ON CUTOFF ENFORCEMENT & SECURITY (Requirement 5):
 * The registration status here is checked client-side using the shared
 * REGISTRATION_DEADLINE constant (both on initial render and on every second tick).
 * To strictly prevent late submissions, a server-side or database-level rule
 * (such as a Supabase Postgres RPC constraint or Firebase Security Rules timestamp check)
 * is necessary since a client's device clock can be manipulated.
 * If external registration forms are used (e.g., Google Forms or Unstop),
 * remember to also configure their native close date / response limits to
 * 26 October 2026, 12:00 PM IST.
 */
export default function EFestHero() {
  // Evaluated on page load (synchronously) so there is zero layout flash
  const [isClosed, setIsClosed] = useState(() => isRegistrationClosed())

  // Updated every second by the FlipCountdown timer interval
  const handleStatusChange = useCallback((status) => {
    setIsClosed(status.isClosed)
  }, [])

  return (
    <div
      className={`efest-hero-card highlight-card event-card ${
        isClosed ? 'registration-closed' : 'registration-open'
      }`}
    >
      <div className="efest-hero-inner">
        {/* ── LEFT: Content ── */}
        <div className="efest-hero-content">
          <div className="efest-hero-top">
            <span className="event-card-tag">Fest</span>
            <span className="event-card-date">September 2026</span>
          </div>

          {/* Registration Status Badge (Text-only, placed directly above the heading) */}
          <div
            className={`efest-hero-badge ${isClosed ? 'badge-closed' : 'badge-open'}`}
            aria-label={isClosed ? 'Registrations Closed' : 'Registrations Open'}
          >
            {isClosed ? 'REGISTRATIONS CLOSED' : 'REGISTRATIONS OPEN'}
          </div>

          <h2 className="efest-hero-title">E&#8209;Fest&nbsp;&#x27;26</h2>

          <p className="efest-hero-desc">
            Success Squad's flagship annual festival, six high-stakes competitions,
            one electrifying weekend. From BGMI battles to startup pitches, this is
            where campus energy peaks.
          </p>

          <div className="efest-hero-actions">
            {!isClosed ? (
              // Open state: fully clickable internal SPA link
              <Link
                id="efest-register-btn"
                to={HUB_PATH}
                className="btn btn-primary"
              >
                Register Now →
              </Link>
            ) : (
              // Closed state: disabled button, greyed out, pointer-events none, link removed
              <button
                id="efest-register-btn"
                type="button"
                className="btn btn-disabled"
                disabled
                aria-disabled="true"
                tabIndex={-1}
              >
                Registrations Closed
              </button>
            )}

            {/* Muted deadline note near the button */}
            <p className="efest-deadline-note">
              {isClosed
                ? 'Registrations closed on 26 Oct, 12:00 PM'
                : 'Registrations open until 26 Oct, 12:00 PM'}
            </p>
          </div>
        </div>

        {/* ── RIGHT: Stat counter & Flip-clock Countdown ── */}
        <div className="efest-hero-right">
          <div className="efest-hero-stat" aria-label={`${EFEST_EVENTS_COUNT} Events`}>
            <span className="efest-stat-num">{EFEST_EVENTS_COUNT}</span>
            <span className="efest-stat-label">Events</span>
            <span className="efest-stat-sub">BGMI · FFLEC · CraftCode · IPL Auction · Pitch · Money Makers</span>
          </div>

          {/* Flip-clock Countdown Timer using the shared deadline */}
          <FlipCountdown
            targetDate={REGISTRATION_DEADLINE}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>
    </div>
  )
}
