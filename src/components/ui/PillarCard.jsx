/**
 * PillarCard — "What we do" pillar on the Home page.
 */
export default function PillarCard({ icon, title, description, delay }) {
  return (
    <div className="pillar-card" style={{ '--delay': delay }}>
      <div className="pillar-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}
