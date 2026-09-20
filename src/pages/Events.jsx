import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import EventCard from '../components/ui/EventCard.jsx'
import { upcomingEvents, pastEvents } from '../data/eventsData.js'

export default function Events() {
  useDocumentTitle('Events')

  return (
    <>
      <div className="page-header">
        <div className="section-label">Events</div>
        <h1>Where ideas <span className="accent">collide.</span></h1>
        <p>From hackathons to fireside chats, we build experiences that inspire, challenge, and connect.</p>
      </div>

      {/* UPCOMING */}
      <section className="section" style={{ background: 'var(--bg)' }}>
        <div className="section-label">Upcoming</div>
        <h2 className="section-title">What's <span className="accent">next.</span></h2>
        <div className="event-cards">
          {upcomingEvents.map((e) => <EventCard key={e.id} {...e} />)}
        </div>
      </section>

      {/* PAST EVENTS */}
      <section className="section" style={{ background: 'var(--bg-2)' }}>
        <div className="section-label">Archive</div>
        <h2 className="section-title">Past <span className="accent">Events</span></h2>
        <div className="past-events">
          {pastEvents.map(({ id, year, title, description, tag }) => (
            <div key={id} className="past-event-row">
              <div className="past-event-left">
                <span className="past-event-year">{year}</span>
                <div>
                  <h4>{title}</h4>
                  <p>{description}</p>
                </div>
              </div>
              <span className="event-tag">{tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-strip">
        <h2>Don't miss our <span className="accent">next event.</span></h2>
        <p>Stay updated by following us on social media or signing up for our newsletter.</p>
        <Link to="/contact" className="btn btn-primary">Stay in the Loop</Link>
      </section>
    </>
  )
}
