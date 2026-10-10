import { useEffect, useRef } from 'react'

/**
 * Attaches an IntersectionObserver to a container ref.
 * When the container enters the viewport, adds `.reveal-visible` to each
 * element matching `selector` within it (with optional stagger via CSS --delay).
 * Matches original main.js revealObserver behavior.
 *
 * @param {string} selector - CSS selector for children to reveal
 * @param {object} options  - IntersectionObserver options
 */
export function useScrollReveal(selector = '.reveal', options = { threshold: 0.1 }) {
  const ref = useRef(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return

    const targets = container.matches(selector)
      ? [container]
      : Array.from(container.querySelectorAll(selector))

    if (targets.length === 0) return

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1'
          entry.target.style.transform = 'translateY(0)'
          obs.unobserve(entry.target)
        }
      })
    }, options)

    targets.forEach((el) => {
      el.style.opacity = '0'
      el.style.transform = 'translateY(20px)'
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease'
      obs.observe(el)
    })

    return () => obs.disconnect()
  }, [selector, options])

  return ref
}
