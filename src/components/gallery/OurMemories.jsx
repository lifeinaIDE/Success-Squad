/**
 * OurMemories.jsx — "Our Memories" 3D scroll-velocity planes section.
 *
 * Direct port of Motion.dev's "Scroll velocity: 3D planes" example.
 * https://motion.dev/examples/vue-scroll-velocity-linked-offset
 *
 * ── MOTION API USAGE MAP ──────────────────────────────────────────────────
 *
 *  useMotionValue(0)         → raw scrollY tracked as a motion value; updated
 *                              imperatively in a scroll listener so useVelocity
 *                              can derive instantaneous speed from it.
 *
 *  useVelocity(scrollY)      → derives instantaneous scroll velocity (px/s)
 *                              from the motion value. Spikes on fast flicks,
 *                              returns to 0 when idle.
 *
 *  useSpring(velocity, cfg)  → smooths the spiky velocity into a fluid signal.
 *                              stiffness=350/damping=35 → tracks fast scrolls
 *                              but won't jitter or overshoot.
 *
 *  useTransform (Plane.jsx)  → maps smoothed velocity → per-plane Z depth +
 *                              Y drift, phase-delayed per plane index so the
 *                              ripple PROPAGATES rather than moving in lockstep.
 *
 *  wrap(0, N)                → cycles N source images across 20 plane slots
 *                              infinitely: wrap(0, 8)(i) = i % 8.
 *
 *  useMotionValueEvent       → subscribes to velocity changes to toggle a
 *                              CSS class WITHOUT triggering React re-renders
 *                              on every animation frame.
 *
 *  useReducedMotion          → when true, velocity offsets are set to [0,0,0]
 *                              inside Plane.jsx — static staggered entrance only.
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

const COLS          = 4
const ROWS          = 5
const TOTAL_PLANES  = COLS * ROWS   // 20 plane slots
const SPRING_CONFIG = { stiffness: 350, damping: 35, mass: 0.5 }

// wrap(0, 8) cycles the 8 source images across 20 slots via safe modulo.
// Called at module level — wrap() itself is a pure function, not a hook.
const wrapIndex = wrap(0, memoriesData.length)

export default function OurMemories() {
  const prefersReducedMotion = useReducedMotion()

  // Safe window.innerWidth check — avoids SSR crash and strict-mode issues
  const [isMobile, setIsMobile] = useState(false)
  const [isFastScroll, setIsFastScroll] = useState(false)
  const fastRef = useRef(false)

  useEffect(() => {
    // Set initial value after mount (window is guaranteed available here)
    setIsMobile(window.innerWidth < 768)
    function onResize() { setIsMobile(window.innerWidth < 768) }
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── 1. RAW SCROLL POSITION ────────────────────────────────────────────────
  // useMotionValue tracks window.scrollY as a Motion value.
  // Updated imperatively so useVelocity can derive speed from it.
  const scrollY = useMotionValue(0)

  useEffect(() => {
    function onScroll() { scrollY.set(window.scrollY) }
    // Sync immediately so the initial value is correct
    scrollY.set(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [scrollY])

  // ── 2. VELOCITY ───────────────────────────────────────────────────────────
  // useVelocity derives instantaneous scroll speed (px/s) from the motion value.
  const scrollVelocity = useVelocity(scrollY)

  // ── 3. SPRING SMOOTHING ───────────────────────────────────────────────────
  // useSpring tames the spiky velocity into a fluid signal.
  const smoothVelocity = useSpring(scrollVelocity, SPRING_CONFIG)

  // ── 4. useMotionValueEvent — side-effects without re-renders ─────────────
  // Subscribes to the smoothed velocity. When |v| > 400 px/s, toggles the
  // "fast-scroll" CSS class that dims plane borders.
  // fastRef prevents setState from being called every single frame — only
  // fires when the boolean actually changes (low-frequency toggle).
  useMotionValueEvent(smoothVelocity, 'change', (v) => {
    const fast = Math.abs(v) > 400
    if (fast !== fastRef.current) {
      fastRef.current = fast
      setIsFastScroll(fast)
    }
  })

  // ── BUILD PLANE GRID ──────────────────────────────────────────────────────
  // 4 cols × 5 rows = 20 plane slots.
  // wrapIndex(i) cycles the 8 source images across all 20 slots.
  const planes = Array.from({ length: TOTAL_PLANES }, (_, i) => {
    const col     = i % COLS
    const row     = Math.floor(i / COLS)
    const dataIdx = wrapIndex(i)           // 0–7 cycled via wrap
    return { index: i, col, row, ...memoriesData[dataIdx] }
  })

  return (
    <section
      className={`memories-section${isFastScroll ? ' memories-fast' : ''}`}
      aria-label="Our Memories"
    >
      {/* Heading */}
      <div className="memories-heading">
        <h2>
          OUR<br />
          <span className="accent">MEMORIES</span>{' '}
          <span className="memories-badge">({memoriesData.length})</span>
        </h2>
      </div>

      {/*
        3D Viewport — CSS handles perspective (1400px) and preserve-3d.
        Motion handles all per-plane transforms (x, y, translateZ, rotate, rotateY).
      */}
      <div className="memories-viewport">
        <div className="memories-track">
          {planes.map(({ index, col, row, src, alt, caption }) => (
            <Plane
              key={`plane-${index}`}
              index={index}
              src={src}
              alt={alt}
              caption={caption}
              col={col}
              row={row}
              smoothVelocity={smoothVelocity}
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>

      <div className="memories-hint">SCROLL TO RELIVE</div>
    </section>
  )
}
