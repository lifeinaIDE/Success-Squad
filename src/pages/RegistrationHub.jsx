/**
 * RegistrationHub.jsx - Hidden E-Fest '26 registration hub.
 *
 * CraftCode (external-unstop): clicking Register Now opens a lightweight
 * UnstopDirectModal with the Unstop link — no multi-step form.
 *
 * Standard events: opens RegistrationModal (team or individual flow).
 */

import { useState, useEffect } from 'react'
import { Helmet }   from 'react-helmet-async'
import { efestEvents } from '../data/eventConfigs.js'
import EventTile        from '../components/events/EventTile.jsx'
import RegistrationModal from '../components/events/RegistrationModal.jsx'
import UnstopDirectModal from '../components/events/UnstopDirectModal.jsx'
import EventsSponsors    from '../components/events/EventsSponsors.jsx'
import { isRegistrationClosed } from '../components/events/FlipCountdown.jsx'

export default function RegistrationHub() {
  const [activeEventId, setActiveEventId]       = useState(null)
  const [unstopEventConfig, setUnstopEventConfig] = useState(null)
  const [isClosed, setIsClosed]                 = useState(() => isRegistrationClosed())

  // Check periodically while the hub page is open
  useEffect(() => {
    if (isClosed) return
    const id = setInterval(() => {
      if (isRegistrationClosed()) {
        setIsClosed(true)
        setActiveEventId(null)
        setUnstopEventConfig(null)
        clearInterval(id)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [isClosed])

  const handleRegister = (event) => {
    if (isClosed) return
    if (event.registrationType === 'external-unstop') {
      // Open the lightweight Unstop modal directly
      setUnstopEventConfig(event)
    } else {
      setActiveEventId(event.id)
    }
  }

  return (
    <>
      <Helmet>
        <title>{isClosed ? "E-Fest '26 — Registrations Closed" : "E-Fest '26 — Register"}</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="E-Fest '26 event registration hub." />
      </Helmet>

      <div className="hub-page">
        <div className="hub-header">
          <div className="section-label">E-Fest '26</div>
          <h1 className="hub-title">
            {isClosed ? (
              <>Registrations are <span className="accent">closed</span></>
            ) : (
              <>Choose your <span className="accent">competition</span></>
            )}
          </h1>
          <p className="hub-sub">
            {isClosed
              ? "Registrations for E-Fest '26 closed on 26 Oct, 12:00 PM IST."
              : 'Six events. One legendary weekend. Pick your battle.'}
          </p>
        </div>

        <div className="hub-grid">
          {efestEvents.map((event) => (
            <EventTile
              key={event.id}
              event={event}
              isClosed={isClosed}
              onRegister={() => handleRegister(event)}
            />
          ))}
        </div>

        <EventsSponsors />
      </div>

      {/* Standard registration modal (team / individual) */}
      <RegistrationModal
        eventId={activeEventId}
        isOpen={!!activeEventId}
        onClose={() => setActiveEventId(null)}
      />

      {/* Lightweight Unstop redirect modal for CraftCode */}
      <UnstopDirectModal
        config={unstopEventConfig}
        isOpen={!!unstopEventConfig}
        onClose={() => setUnstopEventConfig(null)}
      />
    </>
  )
}
