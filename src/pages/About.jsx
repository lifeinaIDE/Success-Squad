import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import ValueItem from '../components/ui/ValueItem.jsx'
import { valuesData } from '../data/valuesData.js'

export default function About() {
  useDocumentTitle('About Us')

  return (
    <>
      <div className="page-header">
        <div className="section-label">About Us</div>
        <h1>We are the <span className="accent">Success Squad</span></h1>
        <p>The Success Squad is a student-led organization dedicated to building a vibrant startup culture on campus — empowering students to dream, build, and lead.</p>
      </div>

      {/* OUR STORY */}
      <section className="section" style={{ background: 'var(--bg)' }}>
        <div className="two-col">
          <div className="col-text">
            <div className="section-label">Our Story</div>
            <h2 className="section-title">Born from a <span className="accent">spark.</span></h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.85', marginBottom: '20px' }}>
              Success Squad was founded with one simple belief: every student has the potential to be a founder. We started
              as a small group of passionate students who wanted to do more than just attend lectures — we wanted to build
              things that matter.
            </p>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.85', marginBottom: '32px' }}>
              Today, we are a thriving community of entrepreneurs, innovators, and dreamers. We run workshops, host industry
              leaders, and support student-led ventures from ideation to launch.
            </p>
            <Link to="/team" className="btn btn-primary">Meet the Team</Link>
          </div>
          <div className="col-visual">
            <div className="about-visual">
              <img src="/images/success-squad-team.jpg" alt="Success Squad Team Photo" className="team-photo" />
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="section" style={{ background: 'var(--bg-2)' }}>
        <div className="section-label">Our Values</div>
        <h2 className="section-title">What we <span className="accent">stand for.</span></h2>
        <div className="values-grid">
          {valuesData.map((v) => <ValueItem key={v.id} {...v} />)}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-strip">
        <h2>Join a community of <span className="accent">builders.</span></h2>
        <p>Applications are open. Take the first step toward building your vision.</p>
        <Link to="/contact" className="btn btn-primary">Apply Now</Link>
      </section>
    </>
  )
}
