import { Link } from 'react-router-dom'

/**
 * Button — renders either a <Link> (internal routing) or an <a> (external).
 * Matches the existing .btn, .btn-primary, .btn-ghost classes from style.css.
 *
 * @param {string}  to        - react-router path (renders <Link>)
 * @param {string}  href      - external URL (renders <a>)
 * @param {string}  variant   - "primary" | "ghost"  (default "primary")
 * @param {string}  className - extra classes
 * @param {object}  style     - inline style overrides
 * @param {*}       children
 */
export default function Button({
  to,
  href,
  variant = 'primary',
  className = '',
  style,
  children,
  ...rest
}) {
  const cls = `btn btn-${variant} ${className}`.trim()

  if (to) {
    return <Link to={to} className={cls} style={style} {...rest}>{children}</Link>
  }

  return (
    <a href={href} className={cls} style={style} {...rest}>
      {children}
    </a>
  )
}
