import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import StartupCard from '../components/ui/StartupCard.jsx'
import { startupsData } from '../data/startupsData.js'

export default function Startups() {
  useDocumentTitle('Startups')

  return (
    <>
      <div className="page-header">
        <div className="section-label">Startups</div>
        <h1>Born on <span className="accent">campus.</span></h1>
        <p>These ventures were nurtured within Success Squad — proof that extraordinary things happen when students dare to build.</p>
      </div>

      {/* PORTFOLIO */}
      <section className="section" style={{ background: 'var(--bg)' }}>
        <div className="section-label">Portfolio</div>
        <h2 className="section-title">Our <span className="accent">Ventures</span></h2>
        <div className="startup-grid">
          {startupsData.map((s) => <StartupCard key={s.id} {...s} />)}
        </div>
      </section>

      {/* INCUBATION CTA */}
      <section className="section incubation-cta" style={{ background: 'var(--bg-2)' }}>
        <div className="section-label">Got an Idea?</div>
        <h2 className="section-title">We'll help you <span className="accent">build it.</span></h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', lineHeight: '1.8', marginBottom: '40px' }}>
          Success Squad's incubation program provides early-stage student startups with mentorship, workspace, access to our
          investor network, and seed support. If you have a product idea, we want to hear it.
        </p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Link to="/contact" className="btn btn-primary">Submit Your Idea</Link>
          <Link to="/about" className="btn btn-ghost">Learn About Success Squad →</Link>
        </div>
      </section>
    </>
  )
}
