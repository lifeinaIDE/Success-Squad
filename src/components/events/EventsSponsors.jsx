import { Link } from 'react-router-dom'
import { mainSponsor, secondarySponsors } from '../../data/sponsorsData.js'

export default function EventsSponsors() {
  return (
    <section className="section events-sponsors-section" aria-label="Event Sponsors">
      <div className="events-sponsors-header">
        <div className="section-label events-sponsors-label">
          POWERED BY &amp; SPONSORS
        </div>
        <Link to="/sponsors" className="events-sponsors-view-all">
          View all sponsors →
        </Link>
      </div>

      <h2 className="section-title">
        Backed by the <span className="accent">best</span>
      </h2>

      <div className="events-sponsors-grid">
        {/* ── 1. FIRST and larger: Connexaa with gold/purple highlight ── */}
        <a
          href={mainSponsor.website}
          target="_blank"
          rel="noopener noreferrer"
          className="events-sponsor-card events-sponsor-card--featured"
          aria-label={`${mainSponsor.name} - ${mainSponsor.tagline} (opens in new tab)`}
        >
          <div className="events-sponsor-logo-wrap events-sponsor-logo-wrap--dark">
            <img
              src={mainSponsor.logo}
              alt={`${mainSponsor.name} logo`}
              className="events-sponsor-logo-img"
              loading="lazy"
            />
          </div>
          <div className="events-sponsor-info">
            <span className="events-sponsor-badge">{mainSponsor.role}</span>
            <h3 className="events-sponsor-name">{mainSponsor.name}</h3>
            <p className="events-sponsor-tagline">{mainSponsor.tagline}</p>
          </div>
          <div className="events-sponsor-arrow">
            Visit Website ↗
          </div>
        </a>

        {/* ── 2 & 3. Centinez and Unstop: light-grey logo cards, smaller ── */}
        {secondarySponsors.map((sponsor) => {
          const CardTag = sponsor.website ? 'a' : 'div'
          const linkProps = sponsor.website
            ? {
                href: sponsor.website,
                target: '_blank',
                rel: 'noopener noreferrer',
                'aria-label': `${sponsor.name} - ${sponsor.tagline} (opens in new tab)`,
              }
            : {}

          return (
            <CardTag
              key={sponsor.id}
              className="events-sponsor-card"
              {...linkProps}
            >
              <div className="events-sponsor-logo-wrap events-sponsor-logo-wrap--light">
                <img
                  src={sponsor.logo}
                  alt={`${sponsor.name} logo`}
                  className="events-sponsor-logo-img"
                  loading="lazy"
                />
              </div>
              <div className="events-sponsor-info">
                <span className="events-sponsor-badge">{sponsor.category}</span>
                <h3 className="events-sponsor-name">{sponsor.name}</h3>
                <p className="events-sponsor-tagline">{sponsor.tagline}</p>
              </div>
              {sponsor.website ? (
                <div className="events-sponsor-arrow">
                  Visit Partner ↗
                </div>
              ) : (
                <div style={{ height: '14px' }} />
              )}
            </CardTag>
          )
        })}
      </div>
    </section>
  )
}
