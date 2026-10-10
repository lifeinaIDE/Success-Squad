/**
 * SectionHeading — standardized section header with label + title.
 * @param {string} label   - small ALL-CAPS label above the title
 * @param {string} title   - heading text, may contain JSX (span.accent etc.)
 * @param {string} [as]    - heading element, default "h2"
 */
export default function SectionHeading({ label, children, as: Tag = 'h2' }) {
  return (
    <>
      {label && <div className="section-label">{label}</div>}
      <Tag className="section-title">{children}</Tag>
    </>
  )
}
