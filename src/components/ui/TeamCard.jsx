/**
 * TeamCard — standard team member card (domain leads + core members).
 *
 * Avatar treatment (progressive enhancement):
 *  - If `photoUrl` exists → "sticker cutout" treatment:
 *      a colored circle halo sits behind the head/upper chest,
 *      the cutout PNG overflows the circle's bottom edge naturally.
 *  - If no `photoUrl` → flat initials-in-gradient-circle fallback.
 *
 * Card dimensions / grid layout are UNCHANGED.
 */

function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function TeamCard({ name, role, image, photoUrl, accentColor, linkedin = null }) {
  const hasSticker = Boolean(photoUrl)

  return (
    <div className="team-card">

      {/* ── Avatar ──────────────────────────────────────────────── */}
      {hasSticker ? (
        // STICKER CUTOUT treatment
        <div className="member-photo-wrapper member-photo-wrapper--sm">
          <div
            className="member-photo-backdrop"
            style={accentColor ? { background: accentColor } : undefined}
            aria-hidden="true"
          />
          <img
            src={photoUrl}
            alt={name}
            className="member-photo"
            loading="lazy"
          />
        </div>
      ) : (
        // FALLBACK: initials-in-circle
        <div className="team-avatar">
          {image ? (
            <img src={image} alt={name} loading="lazy" />
          ) : (
            <span className="team-avatar-initials">{getInitials(name)}</span>
          )}
        </div>
      )}

      <h3>{name}</h3>
      <span className="role">{role}</span>

      {linkedin && (
        <div className="team-social">
          <a href={linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
        </div>
      )}
    </div>
  )
}
