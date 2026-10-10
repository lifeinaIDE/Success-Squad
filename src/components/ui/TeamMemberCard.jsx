/**
 * TODO: The following members do not have a transparent PNG cutout (photoUrl)
 * and are currently using the fallback styling (object-fit: cover on gradient box):
 * - Vaishnavi Shingade
 * - Rudraksh Rajule
 * - Atharva Chechare
 * - Omkar Kadam
 * - Pratiksha Bhosale
 * - Yash Khambekar
 */
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

export default function TeamMemberCard({ name, role, email, phone, photoUrl, image, linkedin }) {
  const hasSticker = Boolean(photoUrl)
  const fallbackImage = image && !hasSticker

  // format for WhatsApp
  const waLink = phone ? `https://wa.me/${phone.replace(/\D/g, '')}` : null

  return (
    <div className="unified-team-card">
      {/* ── LEFT ZONE: Photo & Blob ── */}
      <div className="unified-photo-zone">
        <div className="unified-photo-blob" aria-hidden="true">
          {!hasSticker && !fallbackImage && (
            <span className="unified-avatar-initials">{getInitials(name)}</span>
          )}
          {fallbackImage && (
            <img src={image} alt={name} className="unified-fallback-photo" loading="lazy" />
          )}
        </div>
        {hasSticker && (
          <img
            src={photoUrl}
            alt={name}
            className="unified-photo"
            loading="lazy"
          />
        )}
      </div>

      {/* ── RIGHT ZONE: Info & Socials ── */}
      <div className="unified-info-zone">
        <h3>{name}</h3>
        <span className="role">{role}</span>
        
        <div className="unified-social-icons">
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
