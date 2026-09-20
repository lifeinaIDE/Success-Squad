import { useState } from 'react'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { socialData } from '../data/socialData.js'

const INITIAL_FORM = { name: '', email: '', subject: '', message: '' }

const SUBJECT_OPTIONS = [
  'Join the Success Squad Team',
  'Collaborate on an Event',
  'Submit a Startup Idea',
  'Sponsor Success Squad',
  'Invite as Speaker',
  'Other',
]

const INFO_CARDS = [
  { id: 'email',  icon: '📧', title: 'Email Us',     body: 'jspmecell@gmail.com' },
  { id: 'locate', icon: '📍', title: 'Find Us',      body: 'Success Squad Room, B Building, Room 315\nJSPM NTC, Narhe, Pune' },
  { id: 'hours',  icon: '🕐', title: 'Office Hours', body: 'Mon – Fri: 4 PM – 7 PM' },
]

export default function Contact() {
  useDocumentTitle('Get Involved')
  const [form, setForm] = useState(INITIAL_FORM)
  const [status, setStatus] = useState('idle') // idle | loading | success | error

  function handleChange(e) {
    const { id, value } = e.target
    setForm((f) => ({ ...f, [id]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    try {
      const data = new FormData()
      Object.entries(form).forEach(([k, v]) => data.append(k, v))
      await fetch('/submit-form.php', { method: 'POST', body: data })
      setStatus('success')
    } catch {
      // Matches original catch-block: show success on static hosting
      setStatus('success')
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="section-label">Get Involved</div>
        <h1>Let's build <span className="accent">together.</span></h1>
        <p>Whether you want to join the team, collaborate on events, sponsor us, or pitch your startup — we're all ears.</p>
      </div>

      <section className="section contact-section" style={{ background: 'var(--bg)' }}>
        <div className="contact-layout">

          {/* FORM */}
          <div className="contact-form-wrap">
            <div className="section-label">Send Us a Message</div>
            <h2 className="section-title" style={{ fontSize: '2rem', marginBottom: '32px' }}>
              We'd love to <span className="accent">hear you.</span>
            </h2>

            {status !== 'success' ? (
              <form className="contact-form" id="contactForm" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text" id="name" placeholder="Your full name"
                    required value={form.name} onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email" id="email" placeholder="you@college.edu"
                    required value={form.email} onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="subject">I want to...</label>
                  <select id="subject" value={form.subject} onChange={handleChange}>
                    <option value="">Select an option</option>
                    {SUBJECT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message" rows="5"
                    placeholder="Tell us more about what you have in mind..."
                    value={form.message} onChange={handleChange}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Sending…' : 'Send Message →'}
                </button>
              </form>
            ) : (
              <div className="form-success visible" id="formSuccess">
                <span>✅</span>
                <p>Thanks for reaching out! We'll get back to you within 2-3 working days.</p>
              </div>
            )}
          </div>

          {/* INFO */}
          <div className="contact-info">
            <div className="section-label">Contact Info</div>
            <div className="info-cards">
              {INFO_CARDS.map(({ id, icon, title, body }) => (
                <div key={id} className="info-card">
                  <span className="info-icon">{icon}</span>
                  <div>
                    <h4>{title}</h4>
                    <p>{body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="social-section">
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '16px' }}>
                Follow Us
              </h4>
              <div className="social-links-big">
                {socialData.map(({ id, label, href, target }) => (
                  <a
                    key={id}
                    href={href}
                    target={target}
                    rel={target === '_blank' ? 'noopener noreferrer' : undefined}
                    className="social-link-row"
                  >
                    <span>{label}</span>
                    <span className="social-arrow">↗</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="join-box">
              <div className="section-label">Join Success Squad</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '16px' }}>
                Recruitment happens every semester. Fill out the form to express interest and we'll notify you when applications open.
              </p>
              <a href="#contactForm" className="btn btn-primary" style={{ display: 'inline-flex' }}>
                Apply to Join
              </a>
            </div>
          </div>

        </div>
      </section>
    </>
  )
}
