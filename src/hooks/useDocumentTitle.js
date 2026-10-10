import { useEffect } from 'react'

/**
 * Sets document.title per page. Equivalent to a <title> tag in each HTML page.
 * @param {string} title - page-specific title
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title
      ? `${title} — Success Squad`
      : 'Success Squad — Entrepreneurship Development Cell'
    return () => {
      document.title = 'Success Squad — Entrepreneurship Development Cell'
    }
  }, [title])
}
