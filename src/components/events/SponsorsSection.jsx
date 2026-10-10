/**
 * src/components/events/SponsorsSection.jsx
 *
 * Displays official event sponsors & partners who have sponsored E-Fest '26.
 * Features:
 *  - Categorized tier filters
 *  - Responsive glassmorphism cards with glowing brand accents
 *  - Inline vector SVG brand logos
 *  - Direct links to sponsor portals
 *  - "Become a Sponsor" CTA banner
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { sponsorsData, sponsorTiers } from '../../data/sponsorsData.js'

export default function SponsorsSection({ title = "Official Event Sponsors & Partners", subtitle }) {
  const [activeTier, setActiveTier] = useState('all')

  const filteredSponsors = activeTier === 'all'
    ? sponsorsData
    : sponsorsData.filter(s => s.tier === activeTier)

  return (
    <section className="sponsors-section" style={{
      padding: '70px 0 40px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '250px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 36px' }}>
          <div className="section-label" style={{ display: 'inline-block', marginBottom: '8px' }}>
            🤝 Proud Supporters
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4vw, 2.8rem)',
            fontWeight: 800,
            letterSpacing: '-1px',
            marginBottom: '12px'
          }}>
            {title.includes('Sponsors') ? (
              <>Event <span className="accent">Sponsors</span> & Partners</>
            ) : title}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', lineHeight: '1.6' }}>
            {subtitle || "E-Fest '26 is powered by industry leaders, tech innovators, and community giants who support student excellence and campus entrepreneurship."}
          </p>
        </div>

        {/* Tier Filter Pills */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '36px'
        }}>
          {sponsorTiers.map(tier => (
            <button
              key={tier.id}
              onClick={() => setActiveTier(tier.id)}
              style={{
                padding: '8px 18px',
                borderRadius: '50px',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: activeTier === tier.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: activeTier === tier.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                color: activeTier === tier.id ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tier.label}
            </button>
          ))}
        </div>

        {/* Sponsors Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {filteredSponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className="sponsor-card"
              style={{
                background: 'rgba(20, 20, 31, 0.75)',
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.45)'
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(99,102,241,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Top ambient color strip */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: `linear-gradient(90deg, ${sponsor.brandColor}, ${sponsor.accentColor})`,
              }} />

              <div>
                {/* Header: Tag + Category */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: sponsor.accentColor || 'var(--accent)',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '4px 10px',
                    borderRadius: '50px',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    {sponsor.tag}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    E-Fest '26
                  </span>
                </div>

                {/* Logo Display Area */}
                <div style={{
                  height: '72px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 14px',
                  background: sponsor.logoImg ? '#ffffff' : 'rgba(255,255,255,0.02)',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  border: sponsor.logoImg ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.04)',
                  boxShadow: sponsor.logoImg ? '0 4px 14px rgba(0,0,0,0.2)' : 'none'
                }}>
                  {sponsor.logoImg ? (
                    <img
                      src={sponsor.logoImg}
                      alt={`${sponsor.name} logo`}
                      style={{
                        maxHeight: '46px',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        display: 'block'
                      }}
                    />
                  ) : (
                    <div
                      dangerouslySetInnerHTML={{ __html: sponsor.logoSvg }}
                      style={{ width: '100%', height: '48px', display: 'flex', alignItems: 'center' }}
                    />
                  )}
                </div>

                {/* Sponsor Name & Category */}
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  marginBottom: '4px',
                  color: '#ffffff'
                }}>
                  {sponsor.name}
                </h3>
                <p style={{
                  fontSize: '0.82rem',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  marginBottom: '10px'
                }}>
                  {sponsor.category}
                </p>

                {/* Description */}
                <p style={{
                  fontSize: '0.84rem',
                  color: 'var(--text-muted)',
                  lineHeight: '1.55',
                  marginBottom: '20px'
                }}>
                  {sponsor.description}
                </p>
              </div>

              {/* Action Button */}
              <div>
                <a
                  href={sponsor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    fontSize: '0.82rem',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)'
                  }}
                >
                  Visit Partner Portal <span style={{ marginLeft: '4px' }}>↗</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Sponsor Call To Action Banner */}
        <div style={{
          marginTop: '48px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.04))',
          border: '1px dashed rgba(99,102,241,0.3)',
          borderRadius: '16px',
          padding: '28px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          maxWidth: '1200px',
          margin: '48px auto 0'
        }}>
          <div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>
              Want to Sponsor Success Squad & E-Fest '26?
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '600px', margin: 0 }}>
              Partner with us to gain visibility with 2,500+ ambitious student engineers, founders, gamers, and tech talents.
            </p>
          </div>
          <Link to="/contact" className="btn btn-primary" style={{ padding: '10px 22px' }}>
            Partner With Us →
          </Link>
        </div>
      </div>
    </section>
  )
}
