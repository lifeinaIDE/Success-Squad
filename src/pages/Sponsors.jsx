import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import centinezLogo from '../assets/centinez-logo.png'
import unstopLogo   from '../assets/unstop-logo.png'

/**
 * Sponsors page - lists current Success Squad sponsors.
 * Design mirrors the existing site's dark bg, purple/cyan accents,
 * page-header pattern, and card hover effects.
 */
export default function Sponsors() {
  useDocumentTitle('Sponsors')

  return (
    <>
      {/* ── Page header (same pattern as Gallery, Team, etc.) ── */}
      <div className="page-header">
        <div className="section-label">Our Sponsors</div>
        <h1>
          Partners in&nbsp;
          <span className="accent">Success.</span>
        </h1>
        <p>
          We are grateful to the organisations that believe in our mission and
          help fuel the entrepreneurial ecosystem at Success Squad.
        </p>
      </div>

      {/* ── Sponsors section ── */}
      <section className="section sponsors-section">
        <div className="section-label" style={{ marginBottom: '8px' }}>
          Current sponsors
        </div>
        <h2 className="section-title">
          Backed by the <span className="accent">best.</span>
        </h2>

        <div className="sponsors-grid">

          {/* ── Centinez card ── */}
          <article className="sponsor-card">
            <div className="sponsor-logo-wrap sponsor-logo-wrap--light">
              <img
                src={centinezLogo}
                alt="Centinez logo"
                className="sponsor-logo"
                loading="lazy"
              />
            </div>

            <div className="sponsor-body">
              <div className="sponsor-category">IT Services &amp; Cybersecurity</div>
              <h3 className="sponsor-name">Centinez</h3>
              <p className="sponsor-tagline">
                Secure IT • Stable Business • Stronger Tomorrow
              </p>
              <p className="sponsor-desc">
                Centinez is a forward-thinking IT services and cybersecurity firm
                committed to protecting businesses with robust, future-ready
                solutions. Their partnership with Success Squad reflects a shared
                belief in empowering the next generation of technology-driven
                entrepreneurs.
              </p>
            </div>
          </article>

          {/* ── Unstop card ── */}
          <article className="sponsor-card">
            <div className="sponsor-logo-wrap sponsor-logo-wrap--light">
              <img
                src={unstopLogo}
                alt="Unstop logo"
                className="sponsor-logo"
                loading="lazy"
              />
            </div>

            <div className="sponsor-body">
              <div className="sponsor-category">Platform Partner · E-Fest&nbsp;'26</div>
              <h3 className="sponsor-name">Unstop</h3>
              <p className="sponsor-tagline">
                Discover Talent • Build Communities • Win Together
              </p>
              <p className="sponsor-desc">
                Unstop is India's leading talent discovery, community, and
                competition platform — connecting students and professionals with
                opportunities that matter. As the official platform partner for
                E-Fest&nbsp;'26, Unstop powers registrations and helps us reach
                ambitious participants across the country.
              </p>
            </div>
          </article>

        </div>
      </section>

      {/* ── Become a sponsor CTA ── */}
      <div className="cta-strip">
        <h2>
          Want to <span className="accent">sponsor</span> us?
        </h2>
        <p>
          Partner with Success Squad and connect with 500+ passionate student
          entrepreneurs at our flagship events.
        </p>
        <a href="/contact" className="btn btn-primary">
          Get in touch
        </a>
      </div>
    </>
  )
}
