import { Link } from 'react-router-dom'
import { footerLinks } from '../../data/footerData.js'
import { socialData } from '../../data/socialData.js'

/**
 * Footer — single source of truth for site footer.
 * Links driven by footerLinks and socialData arrays.
 */
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <img
            src="/Success Squad.jpg"
            alt="Success Squad Logo"
            width="103"
            height="100"
            style={{ height: '80px', width: 'auto', display: 'block', marginBottom: '12px', borderRadius: '6px' }}
          />
          <p>Entrepreneurship Development Cell</p>
        </div>

        <div className="footer-links">
          {footerLinks.map(({ id, label, to }) => (
            <Link key={id} to={to}>{label}</Link>
          ))}
        </div>

        <div className="footer-social">
          {socialData.map(({ id, label, href, target }) => (
            <a
              key={id}
              href={href}
              target={target}
              rel={target === '_blank' ? 'noopener noreferrer' : undefined}
              className="social-pill"
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2025 Success Squad. All rights reserved.</span>
        <span className="tagline-footer">From Vision to Venture.</span>
      </div>
    </footer>
  )
}
