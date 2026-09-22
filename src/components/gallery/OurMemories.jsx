/**
 * OurMemories.jsx — "Our Memories" 3D diagonal stack section.
 *
 * Uses scroll velocity to slightly drift the cards, while keeping
 * the section at a normal height (not sticky/scroll-hijacked).
 */
import { useEffect, useRef, useState } from 'react'
import {
  useMotionValue,
  useVelocity,
  useSpring,
  useMotionValueEvent,
  useReducedMotion,
  wrap,
} from 'motion/react'
import Plane from './Plane.jsx'
import { memoriesData } from '../../data/memoriesData.js'

const TOTAL_PLANES = 16
const SPRING_CONFIG = { stiffness: 350, damping: 35, mass: 0.5 }

export default function OurMemories() {
  const prefersReducedMotion = useReducedMotion()

  const [isMobile, setIsMobile] = useState(false)
  const [isFastScroll, setIsFastScroll] = useState(false)
  const fastRef = useRef(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    function onResize() { setIsMobile(window.innerWidth < 768) }
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── 1. RAW SCROLL POSITION ────────────────────────────────────────────────
  const scrollY = useMotionValue(0)

  useEffect(() => {
    function onScroll() { scrollY.set(window.scrollY) }
    scrollY.set(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [scrollY])

  // ── 2. VELOCITY ───────────────────────────────────────────────────────────
  const scrollVelocity = useVelocity(scrollY)

  // ── 3. SPRING SMOOTHING ───────────────────────────────────────────────────
  const smoothVelocity = useSpring(scrollVelocity, SPRING_CONFIG)

  // ── 4. FAST SCROLL DETECTION ──────────────────────────────────────────────
  useMotionValueEvent(smoothVelocity, 'change', (v) => {
    const fast = Math.abs(v) > 400
    if (fast !== fastRef.current) {
      fastRef.current = fast
      setIsFastScroll(fast)
    }
  })

  // ── BUILD PLANE STACK ─────────────────────────────────────────────────────
  const planes = Array.from({ length: TOTAL_PLANES }, (_, i) => {
    const dataIdx = wrap(0, memoriesData.length, i)
    return { index: i, ...memoriesData[dataIdx] }
  })

  return (
    <section
      className={`memories-section${isFastScroll ? ' memories-fast' : ''}`}
      aria-label="Our Memories"
    >
      <div className="memories-viewport">
        {/* Massive heading pinned to the top-left of the viewport */}
        <div className="memories-heading">
          <h2>
            OUR<br />MEMORIES
          </h2>
          <span className="memories-badge">({TOTAL_PLANES})</span>
        </div>

        <div className="memories-track">
          {planes.map(({ index, src, alt, caption }) => (
            <Plane
              key={`plane-${index}`}
              index={index}
              src={src}
              alt={alt}
              caption={caption}
              smoothVelocity={smoothVelocity}
              isMobile={isMobile}
              prefersReducedMotion={prefersReducedMotion}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
