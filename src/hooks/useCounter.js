import { useState, useEffect, useRef } from 'react'

/**
 * Animates a numeric counter from 0 to `target` over `duration` ms
 * when the element enters the viewport.
 * Matches original main.js setInterval approach with 16ms step.
 *
 * @param {number} target  - final value
 * @param {number} duration - ms (default 1800)
 * @returns {{ ref, count }} - attach ref to a container, read count
 */
export function useCounter(target, duration = 1800) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef(null)

  // IntersectionObserver triggers start
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true)
          obs.unobserve(el)
        }
      },
      { threshold: 0.2 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Run the counter animation once triggered
  useEffect(() => {
    if (!started) return
    const step = target / (duration / 16)
    let current = 0
    const timer = setInterval(() => {
      current += step
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [started, target, duration])

  return { ref, count }
}
