import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import FeaturedTeamCard from '../components/ui/FeaturedTeamCard.jsx'
import TeamCard from '../components/ui/TeamCard.jsx'
import AlumniCard from '../components/ui/AlumniCard.jsx'
import { leadership, domainLeads, coreMembers, alumni } from '../data/teamData.js'

export default function Team() {
  useDocumentTitle('Our Team')

  return (
    <>
      <div className="page-header">
        <div className="section-label">Our Team</div>
        <h1>The people behind <span className="accent">Success Squad.</span></h1>
        <p>A diverse group of passionate students driving innovation, leadership, and entrepreneurial change on campus.</p>
      </div>

      {/* LEADERSHIP */}
      <section className="section" style={{ background: 'var(--bg)' }}>
        <div className="section-label">Leadership</div>
        <h2 className="section-title">Core <span className="accent">Committee</span></h2>
        <div className="team-grid-featured">
          {leadership.map((m) => <FeaturedTeamCard key={m.id} {...m} />)}
        </div>
      </section>

      {/* DOMAIN LEADS */}
      <section className="section" style={{ background: 'var(--bg-2)' }}>
        <div className="section-label">Domain Leads</div>
        <h2 className="section-title">Meet the <span className="accent">Leads</span></h2>
        <div className="team-grid">
          {domainLeads.map((m) => <TeamCard key={m.id} {...m} />)}
        </div>
      </section>

      {/* CORE MEMBERS */}
      <section className="section" style={{ background: 'var(--bg)' }}>
        <div className="section-label">Core Members</div>
        <h2 className="section-title">The <span className="accent">Builders</span></h2>
        <div className="team-grid">
          {coreMembers.map((m) => <TeamCard key={m.id} {...m} />)}
        </div>
      </section>

      {/* ALUMNI */}
      <section className="section" style={{ background: 'var(--bg-2)' }}>
        <div className="section-label">Alumni</div>
        <h2 className="section-title">Our <span className="accent">Legacy</span></h2>
        <div className="alumni-grid">
          {alumni.map((a, idx) => (
            <AlumniCard key={a.id} {...a} i={idx + 1} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-strip">
        <h2>Want to be part of the <span className="accent">team?</span></h2>
        <p>We recruit every semester. Watch this space for openings.</p>
        <Link to="/contact" className="btn btn-primary">Express Interest</Link>
      </section>
    </>
  )
}
