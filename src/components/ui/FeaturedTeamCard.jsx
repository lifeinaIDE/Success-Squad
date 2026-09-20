/**
 * FeaturedTeamCard — large leadership card with bio and LinkedIn link.
 * Used in the "Core Committee" section on the Team page.
 */
export default function FeaturedTeamCard({ name, role, bio, image, linkedin }) {
  return (
    <div className="team-card-featured">
      <div className="team-avatar-lg">
        <img src={image} alt={name} loading="lazy" />
      </div>
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
