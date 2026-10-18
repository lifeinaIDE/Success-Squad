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
          background: '#0a0a0f',
          color: '#ffffff',
          fontFamily: "'Inter', sans-serif",
          padding: '40px',
          textAlign: 'center',
          gap: '16px',
        }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2.5rem', fontWeight: 800, color: '#6366f1' }}>
            Something went wrong
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', maxWidth: '480px', lineHeight: 1.7, marginBottom: '12px' }}>
            Please refresh the page or try again in a few minutes.
          </p>
          {this.state.message && (
            <pre style={{
              background: '#14141f',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '12px 18px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              maxWidth: '650px',
              overflowX: 'auto',
              marginBottom: '20px',
              textAlign: 'left',
              fontFamily: 'monospace'
            }}>
              {this.state.message}
            </pre>
          )}
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
