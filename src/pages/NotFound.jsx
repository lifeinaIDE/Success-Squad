import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function NotFound() {
  useDocumentTitle('404 — Page Not Found')

  return (
    <section className="hero" style={{ minHeight: '80vh', textAlign: 'center', justifyContent: 'center' }}>
      <div className="hero-bg-grid" />
      <div className="hero-content" style={{ textAlign: 'center', margin: '0 auto' }}>
        <div className="hero-badge" style={{ justifyContent: 'center' }}>
          <span className="badge-dot" />
          404 Error
        </div>
        <h1 className="hero-title">
          <span className="line-reveal">Page not</span>
          <span className="line-reveal delay-1"><em>found.</em></span>
        </h1>
        <p className="hero-sub line-reveal delay-2">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="hero-actions line-reveal delay-3">
          <Link to="/" className="btn btn-primary">Go Home</Link>
          <Link to="/contact" className="btn btn-ghost">Contact Us →</Link>
        </div>
      </div>
    </section>
  )
}
