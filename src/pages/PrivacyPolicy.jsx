import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function PrivacyPolicy() {
  useDocumentTitle('Privacy Policy')

  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="page-header" style={{ paddingBottom: '80px' }}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
        <div className="hero-badge" style={{ marginBottom: '16px' }}>
          <span className="badge-dot" />
          Legal
        </div>
        <h1 className="hero-title" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '16px' }}>
          Privacy Policy
        </h1>
        <p className="hero-sub" style={{ fontSize: '1rem', marginBottom: '48px' }}>
          Last updated: {lastUpdated}
        </p>

        <div className="privacy-content" style={{ color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '1.05rem' }}>
          
          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginTop: '32px', marginBottom: '16px', fontWeight: 600 }}>Introduction</h2>
          <p style={{ marginBottom: '16px' }}>
            Welcome to the Success Squad, the Entrepreneurship Development Cell of TSSM and JSPM NTC. 
            We respect your privacy and are committed to protecting any personal data you share with us.
          </p>

          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginTop: '32px', marginBottom: '16px', fontWeight: 600 }}>Information we collect</h2>
          <p style={{ marginBottom: '16px' }}>
            We only collect information that you voluntarily provide to us, such as your name, email address, phone number, and message contents when you submit forms on our website (like the Contact form or event registration forms).
          </p>

          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginTop: '32px', marginBottom: '16px', fontWeight: 600 }}>How we use information</h2>
          <p style={{ marginBottom: '16px' }}>
            The information we collect is used strictly for internal purposes. This includes responding to your inquiries, managing your event registrations, sending updates about our activities, and improving our services. We do not use your information for targeted advertising.
          </p>

          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginTop: '32px', marginBottom: '16px', fontWeight: 600 }}>Cookies and third-party services</h2>
          <p style={{ marginBottom: '16px' }}>
            Our website uses minimal third-party services necessary for functionality and basic analytics. These may include Google Fonts for typography and social media links (such as YouTube, Instagram, and LinkedIn). We do not deploy invasive tracking cookies.
          </p>

          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginTop: '32px', marginBottom: '16px', fontWeight: 600 }}>Data sharing and security</h2>
          <p style={{ marginBottom: '16px' }}>
            We implement appropriate security measures to protect your data. We do not sell, trade, or rent your personal information to third parties. Data may only be shared if required by law or to trusted partners strictly assisting us in operating our cell, under confidentiality agreements.
          </p>

          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginTop: '32px', marginBottom: '16px', fontWeight: 600 }}>Your rights and how to request deletion</h2>
          <p style={{ marginBottom: '16px' }}>
            You have the right to access, update, or request the deletion of your personal data at any time. If you wish to exercise these rights or have any questions about the data we hold, please contact us.
          </p>

          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginTop: '32px', marginBottom: '16px', fontWeight: 600 }}>Changes to this policy</h2>
          <p style={{ marginBottom: '16px' }}>
            We may update this Privacy Policy periodically to reflect changes in our practices. We encourage you to review this page occasionally. Your continued use of our website after changes indicates your acceptance of the updated policy.
          </p>

          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginTop: '32px', marginBottom: '16px', fontWeight: 600 }}>Contact</h2>
          <p style={{ marginBottom: '16px' }}>
            If you have any questions or concerns about this Privacy Policy, please contact us at: <strong>[CONTACT_EMAIL]</strong>.
          </p>

        </div>
      </div>
    </div>
  )
}
