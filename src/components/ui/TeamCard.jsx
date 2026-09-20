/**
 * TeamCard — standard team member card with avatar, name, role, optional LinkedIn.
 * Used for domain leads and core members on the Team page.
 */
export default function TeamCard({ name, role, image, linkedin = null }) {
  return (
    <div className="team-card">
      <div className="team-avatar">
        <img src={image} alt={name} loading="lazy" />
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
