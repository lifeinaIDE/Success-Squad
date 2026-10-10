import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function Sponsors() {
  useDocumentTitle('Sponsors')

  return (
    <>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="section-label">Partners & Sponsors</div>
        <h1>Powering our <span className="accent">Vision.</span></h1>
        <p>
          We collaborate with pioneering companies, tech innovators, and ecosystem builders
          to empower students, fund hackathons, and accelerate campus startups.
        </p>
      </div>

      {/* FEATURED TITLE SPONSOR HERO SPOTLIGHT */}
      <section className="section" style={{ background: 'var(--bg)', paddingTop: '20px', paddingBottom: '30px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="section-label" style={{ marginBottom: '12px' }}>⭐ Title Partner Spotlight</div>
          <h2 className="section-title" style={{ marginBottom: '28px' }}>
            Featured <span className="accent">Platform Partner</span>
          </h2>

          <div
            style={{
              background: 'linear-gradient(135deg, rgba(28, 73, 194, 0.12), rgba(20, 20, 31, 0.85))',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '24px',
              padding: 'clamp(24px, 5vw, 44px)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '36px',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), 0 0 30px rgba(28, 73, 194, 0.15)'
            }}
          >
            {/* Ambient background glow */}
            <div
              style={{
                position: 'absolute',
                top: '-40%',
                right: '-10%',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
                pointerEvents: 'none',
                zIndex: 0
              }}
            />

            {/* Left Column: Visual Brand Box */}
            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  padding: '36px 28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
                  border: '2px solid rgba(255, 255, 255, 0.9)',
                  maxWidth: '380px',
                  margin: '0 auto',
                  transition: 'transform 0.3s ease',
                }}
              >
                <img
                  src="/images/unstop-logo.png"
                  alt="Unstop Logo"
                  style={{
                    maxHeight: '75px',
                    width: 'auto',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: '#60a5fa',
                    background: 'rgba(59, 130, 246, 0.15)',
                    padding: '6px 14px',
                    borderRadius: '50px',
                    border: '1px solid rgba(96, 165, 250, 0.3)'
                  }}
                >
                  Official Title Partner
                </span>
              </div>
            </div>

            {/* Right Column: Information & Details */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>🚀</span>
                <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.5px' }}>
                  E-FEST '26 PLATFORM PARTNER
                </span>
              </div>

              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
                  fontWeight: 800,
                  color: '#ffffff',
                  marginBottom: '12px',
                  letterSpacing: '-0.5px'
                }}
              >
                Unstop
              </h3>

              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '1rem',
                  lineHeight: '1.7',
                  marginBottom: '20px'
                }}
              >
                Unstop is India's leading talent discovery, community, and competition platform.
                As the official National Hackathon & Registration Platform Partner for Success Squad E-Fest '26,
                Unstop powers our seamless student onboarding, project submissions, and nationwide visibility.
              </p>

              {/* Perks Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  marginBottom: '26px'
                }}
              >
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.07)'
                  }}
                >
                  <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: '0.85rem' }}>✨ Live Onboarding</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
                    Seamless national team registration
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.07)'
                  }}
                >
                  <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: '0.85rem' }}>🏆 Verified Credentials</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
                    Industry-recognized certificates
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.07)'
                  }}
                >
                  <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: '0.85rem' }}>💼 Talent Discovery</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
                    Direct placement & internship track
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <a
                  href="https://unstop.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{
                    padding: '12px 24px',
                    borderRadius: '50px',
                    background: '#1c49c2',
                    borderColor: '#3b82f6',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Explore Unstop Platform <span>↗</span>
                </a>

                <Link
                  to="/events"
                  className="btn btn-ghost"
                  style={{
                    padding: '12px 22px',
                    borderRadius: '50px'
                  }}
                >
                  View E-Fest Competitions →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PARTNERSHIP STATS */}
      <section className="section" style={{ background: 'var(--bg-2)', padding: '60px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div className="section-label">Impact & Reach</div>
          <h2 className="section-title">Why Brands <span className="accent">Partner With Us</span></h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto 40px', lineHeight: '1.7' }}>
            Success Squad connects sponsor organizations directly to high-potential student engineers, designers, and founders.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '24px'
            }}
          >
            <div
              style={{
                background: 'rgba(20, 20, 31, 0.6)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '30px 20px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)' }}>
                2,500+
              </div>
              <div style={{ color: '#ffffff', fontWeight: 600, marginTop: '6px' }}>Student Participants</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>
                Across engineering, AI & entrepreneurship
              </div>
            </div>

            <div
              style={{
                background: 'rgba(20, 20, 31, 0.6)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '30px 20px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, color: '#06b6d4' }}>
                50+
              </div>
              <div style={{ color: '#ffffff', fontWeight: 600, marginTop: '6px' }}>Colleges Represented</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>
                Statewide & national outreach
              </div>
            </div>

            <div
              style={{
                background: 'rgba(20, 20, 31, 0.6)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '30px 20px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, color: '#f59e0b' }}>
                10+
              </div>
              <div style={{ color: '#ffffff', fontWeight: 600, marginTop: '6px' }}>Flagship Competitions</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>
                Hackathons, esports, pitch decks & expos
              </div>
            </div>

            <div
              style={{
                background: 'rgba(20, 20, 31, 0.6)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '30px 20px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, color: '#ec4899' }}>
                ₹50,000+
              </div>
              <div style={{ color: '#ffffff', fontWeight: 600, marginTop: '6px' }}>Total Cash & Grants</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>
                Directly distributed to student winners
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BECOME A SPONSOR CTA */}
      <section className="cta-strip">
        <h2>Become an Official <span className="accent">Event Sponsor.</span></h2>
        <p>Gain direct exposure to the next generation of engineers, builders, and tech leaders.</p>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
          <Link to="/contact" className="btn btn-primary">
            Partner With Us →
          </Link>
          <a
            href="mailto:contact@successsquad.in?subject=Sponsorship%20Inquiry%20-%20Success%20Squad"
            className="btn btn-ghost"
          >
            Email Sponsorship Team
          </a>
        </div>
      </section>
    </>
  )
}
