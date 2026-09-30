import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useCounter } from '../hooks/useCounter.js'
import { useScrollReveal } from '../hooks/useScrollReveal.js'
import PillarCard from '../components/ui/PillarCard.jsx'
import { statsData } from '../data/statsData.js'
import { pillarsData } from '../data/pillarsData.js'

// Marquee words from index.html
const MARQUEE_WORDS = [
  'Innovate', 'Build', 'Disrupt', 'Launch', 'Scale', 'Dream', 'Execute', 'Grow', 'Inspire',
]

// Event teaser rows from index.html
const TEASER_EVENTS = [
  { id: 'aignite',    date: 'FEB 2026', name: 'Aignite',                          tag: 'Hackathon' },
  { id: 'sprint',     date: 'OCT 2025', name: 'Startup Sprint - Hackathon',        tag: 'Hackathon' },
  { id: 'pitch',      date: 'OCT 2025', name: 'Venture Pitch — Investor Demo Day', tag: 'Pitching'  },
  { id: 'illuminate', date: 'OCT 2025', name: 'Illuminate 2025',                   tag: 'Workshop'  },
]

function StatItem({ target, label }) {
  const { ref, count } = useCounter(target)
  return (
    <div className="stat-item" ref={ref}>
      <span className="stat-num">{count}</span><span className="stat-plus">+</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

export default function Home() {
  useDocumentTitle(null)
  const revealRef = useScrollReveal('.event-row, .cta-strip h2, .cta-strip p')

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-bg-grid" />
        <div className="hero-glow glow-1" />
        <div className="hero-glow glow-2" />

        <div className="hero-columns">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot" />
              Entrepreneurship Development Cell
            </div>
            <h1 className="hero-title">
              <span className="line-reveal">From Vision</span>
              <span className="line-reveal delay-1">to <em>Venture.</em></span>
            </h1>
            <p className="hero-sub line-reveal delay-2">
              We ignite entrepreneurial spirits, nurture bold ideas, and build the founders of
              tomorrow — right here on campus.
            </p>
            <div className="hero-actions line-reveal delay-3">
              <Link to="/about" className="btn btn-primary">Discover EDC</Link>
              <Link to="/events" className="btn btn-ghost">View Events →</Link>
            </div>
          </div>

          <div className="hero-journey" aria-hidden="true">
            <svg className="journey-svg" viewBox="0 0 380 480" preserveAspectRatio="xMidYMid meet">
              <path
                className="journey-path"
                d="M57,422 C67.77,406.07 99.43,358.33 121.6,326.4 C143.77,294.47 167.2,262.4 190,230.4 C212.8,198.4 236.23,166.4 258.4,134.4 C280.57,102.4 312.23,54.4 323,38.4"
              />
            </svg>

            <div className="journey-particle" />

            <div className="journey-node node-idea">
              <span className="node-icon">💡</span>
              <span className="node-label">Idea</span>
            </div>
            <div className="journey-node node-build">
              <span className="node-icon">⚙️</span>
              <span className="node-label">Build</span>
            </div>
            <div className="journey-node node-team">
              <span className="node-icon">🤝</span>
              <span className="node-label">Team</span>
            </div>
            <div className="journey-node node-launch">
              <span className="node-icon">📡</span>
              <span className="node-label">Launch</span>
            </div>
            <div className="journey-node node-venture">
              <span className="node-icon">✦</span>
              <span className="node-label">Venture</span>
            </div>

            <div className="journey-gather">
              <span className="gather-dot gd-1" />
              <span className="gather-dot gd-2" />
              <span className="gather-dot gd-3" />
              <span className="gather-dot gd-4" />
              <span className="gather-dot gd-5" />
            </div>

            <div className="journey-rocket">🚀</div>

            <span className="journey-spark spark-1" />
            <span className="journey-spark spark-2" />
            <span className="journey-spark spark-3" />
          </div>
        </div>

        <div className="hero-stats">
          {statsData.map(({ id, target, label }, i) => (
            <>
              {i > 0 && <div key={`div-${id}`} className="stat-divider" />}
              <StatItem key={id} target={target} label={label} />
            </>
          ))}
        </div>
      </section>

      {/* WHAT WE DO */}
      <section className="section pillars">
        <div className="section-label">What We Do</div>
        <h2 className="section-title">Turning ideas into<br /><span className="accent">impact.</span></h2>
        <div className="pillars-grid">
          {pillarsData.map((p) => <PillarCard key={p.id} {...p} />)}
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {[...MARQUEE_WORDS, ...MARQUEE_WORDS].map((word, i) => (
            // Double list for seamless loop; index as key is stable for static array
            <span key={`${word}-${i}`}>{word}</span>
          ))}
        </div>
      </div>

      {/* EVENTS TEASER */}
      <section className="section events-teaser" ref={revealRef}>
        <div className="section-label" />
        <div className="events-header">
          <h2 className="section-title">Events &<br /><span className="accent">Initiatives</span></h2>
          <Link to="/events" className="btn btn-ghost">See All →</Link>
        </div>
        <div className="events-list">
          {TEASER_EVENTS.map(({ id, date, name, tag }) => (
            <div key={id} className="event-row">
              <span className="event-date">{date}</span>
              <span className="event-name">{name}</span>
              <span className="event-tag">{tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="cta-strip">
        <h2>Ready to build something <span className="accent">extraordinary?</span></h2>
        <p>Join EDC and become part of a community that turns vision into venture.</p>
        <Link to="/contact" className="btn btn-primary">Join the Movement</Link>
      </section>
    </>
  )
}
