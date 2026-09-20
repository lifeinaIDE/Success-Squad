import { useState, useEffect } from 'react'

/**
 * Tracks whether the page has scrolled past 20px.
 * Replaces the imperative scroll listener in main.js that toggled .scrolled on #navbar.
 */
export function useScrolled(threshold = 20) {
  const [scrolled, setScrolled] = useState(window.scrollY > threshold)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > threshold)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return scrolled
}
