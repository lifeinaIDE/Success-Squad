import { Mail, MessageCircle } from 'lucide-react'

function LinkedinIcon({ size = 18 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}


function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function FeaturedTeamCard({ name, role, email, phone, photoUrl, linkedin }) {
  const hasSticker = Boolean(photoUrl)

  // format for WhatsApp
  const waLink = phone ? `https://wa.me/${phone.replace(/\D/g, '')}` : null

  return (
    <div className="featured-card">
      {/* ── LEFT ZONE: Photo & Blob ── */}
      <div className="featured-photo-zone">
        <div className="featured-photo-blob" aria-hidden="true">
          {!hasSticker && <span className="team-avatar-initials">{getInitials(name)}</span>}
        </div>
        {hasSticker && (
          <img
            src={photoUrl}
            alt={name}
            className="featured-photo"
            loading="lazy"
          />
        )}
      </div>

      {/* ── RIGHT ZONE: Info & Socials ── */}
      <div className="featured-info-zone">
        <h3>{name}</h3>
        <span className="role">{role}</span>
        
        <div className="featured-social-icons">
          {email && (
            <a href={`mailto:${email}`} aria-label="Email" title="Email" target="_blank" rel="noopener noreferrer">
              <Mail size={18} />
            </a>
          )}
          {waLink && (
            <a href={waLink} aria-label="WhatsApp" title="WhatsApp" target="_blank" rel="noopener noreferrer">
              <MessageCircle size={18} />
            </a>
          )}
          {linkedin && (
            <a href={linkedin} aria-label="LinkedIn" title="LinkedIn" target="_blank" rel="noopener noreferrer">
              <LinkedinIcon size={18} />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
