/**
 * RegistrationHub.jsx — Hidden E-Fest '26 registration hub.
 *
 * ⚠️  SECURITY NOTE (obscurity, not access control):
 *     This page is "hidden" only in the sense that:
 *       - It's not linked from any nav, footer, or sitemap
 *       - Its route slug is a non-guessable token stored in VITE_FEST_SLUG
 *       - It carries <meta name="robots" content="noindex,nofollow" />
 *     HOWEVER — anyone with the URL (via browser history, shared screenshot,
 *     or JS bundle inspection) CAN reach this page. There is NO real access
 *     control gate here.
 *
 *     TODO (future upgrade): If stronger gating is required, implement a
 *     short-lived signed token as a query param (e.g. ?t=<HMAC>) validated
 *     server-side (Vercel Edge Function or Firebase Cloud Function) before
 *     rendering any page content. This is the recommended upgrade path.
 *
 * This component renders a 2×3 grid of EventTile cards (one per E-Fest event).
 * Only BGMI LEC is fully wired; others show a "Coming Soon" disabled state.
 */

import { useState } from 'react'
import { Helmet }   from 'react-helmet-async'
import { efestEvents } from '../data/eventConfigs.js'
import EventTile        from '../components/events/EventTile.jsx'
import RegistrationModal from '../components/events/RegistrationModal.jsx'

export default function RegistrationHub() {
  const [activeEventId, setActiveEventId] = useState(null)

  return (
    <>
      {/* noindex/nofollow so search engines never index this page */}
      <Helmet>
        <title>E-Fest '26 — Register</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="E-Fest '26 event registration hub." />
      </Helmet>

      <div className="hub-page">
        <div className="hub-header">
          <div className="section-label">E-Fest '26</div>
          <h1 className="hub-title">
            Choose your <span className="accent">competition.</span>
          </h1>
          <p className="hub-sub">
            Six events. One legendary weekend. Pick your battle.
          </p>
        </div>

        <div className="hub-grid">
          {efestEvents.map((event) => (
            <EventTile
              key={event.id}
              event={event}
              onRegister={() => setActiveEventId(event.id)}
            />
          ))}
        </div>
      </div>

      {/* Registration modal — only mounts when an event is selected */}
      <RegistrationModal
        eventId={activeEventId}
        isOpen={!!activeEventId}
        onClose={() => setActiveEventId(null)}
      />
    </>
  )
}
