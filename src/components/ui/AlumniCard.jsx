/**
 * AlumniCard — numbered alumni entry in the cascading grid.
 */
export default function AlumniCard({ index, name, role, i }) {
  return (
    <div className="alumni-card" style={{ '--i': i }}>
      <span className="alumni-index">{index}</span>
      <h3 className="alumni-name">{name}</h3>
      <span className="alumni-role">{role}</span>
    </div>
  )
}
