/**
 * TeamCard — standard team member card with avatar, name, role, optional LinkedIn.
 * Used for domain leads and core members on the Team page.
 * When no image is provided, renders a gradient circle with the member's initials.
 */

function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function TeamCard({ name, role, image, linkedin = null }) {
  return (
    <div className="team-card">
      <div className="team-avatar">
        {image ? (
          <img src={image} alt={name} loading="lazy" />
        ) : (
          <span className="team-avatar-initials">{getInitials(name)}</span>
        )}
      </div>
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
