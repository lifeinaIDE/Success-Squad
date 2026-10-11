import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { Helmet } from 'react-helmet-async'

export default function NotFound() {
  useDocumentTitle('404 - Page Not Found')

  return (
    <section className="hero" style={{ minHeight: '80vh', textAlign: 'center', justifyContent: 'center' }}>
      <Helmet>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="hero-bg-grid" />
      <div className="hero-content" style={{ textAlign: 'center', margin: '0 auto' }}>
        <h1 className="hero-title" style={{ fontSize: 'clamp(4rem, 15vw, 8rem)', color: 'var(--accent)', marginBottom: '16px' }}>
          404
        </h1>
        <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>
          Page not found
        </h2>
        <p className="hero-sub" style={{ marginBottom: '32px' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="hero-actions" style={{ justifyContent: 'center' }}>
          <Link to="/" className="btn btn-primary">Back to Home</Link>
          <Link to="/contact" className="btn btn-ghost">Contact Us</Link>
        </div>
      </div>
    </section>
  )
}

