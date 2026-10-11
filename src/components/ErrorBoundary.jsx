import { Component } from 'react'

/**
 * ErrorBoundary - catches any render error in the subtree and shows
 * a fallback instead of a completely blank screen.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message ?? 'Unknown error' }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          color: 'var(--text)',
          fontFamily: 'var(--font-body)',
          padding: '40px',
          textAlign: 'center',
          gap: '16px',
        }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)' }}>
            Something went wrong
          </h1>
          <p style={{ color: 'var(--text-muted)', maxWidth: '480px', lineHeight: 1.7, marginBottom: '24px' }}>
            Please refresh the page or try again in a few minutes.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 28px',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '50px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
            <a
              href="/"
              style={{
                padding: '12px 28px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '50px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'none'
              }}
            >
              Back to Home
            </a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
