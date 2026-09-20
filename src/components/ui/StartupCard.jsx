/**
 * StartupCard — portfolio card for the Startups page.
 */
export default function StartupCard({ logoText, tag, name, description, website, websiteLabel }) {
  return (
    <div className="startup-card">
      <div className="startup-logo">{logoText}</div>
      <div className="startup-info">
        <span className="startup-tag">{tag}</span>
        <h3>{name}</h3>
        <p>{description}</p>
        {website && (
          <div className="startup-meta">
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block', marginTop: '8px' }}
            >
              {websiteLabel}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
