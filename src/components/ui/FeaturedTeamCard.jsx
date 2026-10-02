/**
 * FeaturedTeamCard — large leadership card with bio and LinkedIn link.
 * Used in the "Core Committee" section on the Team page.
 *
 * Avatar treatment (progressive enhancement):
 *  - If `photoUrl` exists → large "sticker cutout" treatment (same system,
 *    larger size via --lg modifier).
 *  - If no `photoUrl` → existing initials-in-circle fallback.
 */

function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function FeaturedTeamCard({ name, role, bio, image, photoUrl, accentColor, linkedin }) {
  const hasSticker = Boolean(photoUrl)

  return (
    <div className="team-card-featured">

      {/* ── Avatar ──────────────────────────────────────────────── */}
      {hasSticker ? (
        // STICKER CUTOUT treatment — larger size for featured cards
        <div className="member-photo-wrapper member-photo-wrapper--lg">
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
        // FALLBACK: existing initials circle
        <div className="team-avatar-lg">
          {image ? (
            <img src={image} alt={name} loading="lazy" />
          ) : (
            <span className="team-avatar-initials">{getInitials(name)}</span>
          )}
        </div>
      )}

      <h3>{name}</h3>
      <span className="role">{role}</span>
      {bio && <p>{bio}</p>}

      {linkedin && (
        <div className="team-social">
          <a href={linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
        </div>
      )}
    </div>
  )
}
