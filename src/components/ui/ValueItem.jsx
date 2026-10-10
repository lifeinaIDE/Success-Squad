/**
 * ValueItem — a single "Our Values" entry on the About page.
 */
export default function ValueItem({ num, title, description }) {
  return (
    <div className="value-item">
      <span className="value-num">{num}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}
