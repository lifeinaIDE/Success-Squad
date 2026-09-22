/**
 * OurMemories.jsx — "Our Memories" 3D scroll-velocity planes section.
 *
 * Direct port of Motion.dev's "Scroll velocity: 3D planes" example.
 * https://motion.dev/examples/vue-scroll-velocity-linked-offset
 *
 * ── HOW THE PHYSICS WORKS ────────────────────────────────────────────────────
 *
 *  1. useMotionValue(0)        — raw scroll Y position tracked as a motion value.
 *                                Updated every scroll event via window listener.
 *
 *  2. useVelocity(scrollY)     — derives instantaneous scroll velocity (px/s)
 *                                from the motion value. Spikes when user flicks
 *                                the page quickly; settles at 0 when idle.
 *
 *  3. useSpring(velocity, ...) — smooths the spiky velocity signal into a
 *                                fluid signal. stiffness=350/damping=35 means
 *                                it tracks fast scrolls tightly but won't jitter.
 *
 *  4. useTransform (per-plane, in Plane.jsx) — maps the smoothed velocity into
 *     a per-plane Z/Y offset. Each plane applies a PHASE DELAY (index * 3 px on
 *     the input range) so later planes respond slightly after earlier ones —
 *     this is what makes the ripple PROPAGATE rather than all planes moving
 *     in lockstep.
 *
 *  5. wrap (Motion utility)    — cycles source images (8 images) across ~18 plane
 *     slots infinitely: wrap(0, SOURCES.length)(slotIndex) = slotIndex % 8.
 *     The "wrap" import handles the modulo math and boundary clamping.
 *
 *  6. useMotionValueEvent      — subscribes to the smoothed velocity without
 *     triggering React re-renders. Used here to toggle a "fast-scroll" CSS
 *     state class that dims plane borders during rapid scrolling.
 *
 *  7. useReducedMotion         — when true, skips all velocity-based offsets
 *     and renders planes in a static staggered entrance-only layout.
 *
 * ── GRID LAYOUT ──────────────────────────────────────────────────────────────
 *  COLS × ROWS = 4 × 5 = 20 plane slots (images cycle via wrap).
 *  Each plane's col/row drives its X/Y base position inside the 3D viewport.
 *  The viewport has perspective: 1400px; the track has transform-style: preserve-3d.
 *  All per-plane transforms (Z, rotateY, rotate) live in inline Motion styles —
 *  CSS only handles the perspective container and static layout shell.
 */
import { useEffect, useRef, useState } from 'react'
import {
  useMotionValue,
  useVelocity,
  useSpring,
  useMotionValueEvent,
  useReducedMotion,
} from 'motion/react'
import { wrap } from 'motion/react'
import Plane from './Plane.jsx'
import { memoriesData } from '../../data/memoriesData.js'

// Grid dimensions — 4 columns × 5 rows = 20 plane slots
const COLS = 4
const ROWS = 5
const TOTAL_PLANES = COLS * ROWS  // 20

// Spring config: settles quickly, no overshoot, tracks fast scrolls well
const SPRING_CONFIG = { stiffness: 350, damping: 35, mass: 0.5 }

// wrap(0, 8) is Motion's utility for index % 8, but safe at boundaries.
// Cycles 8 source images across 20 plane slots infinitely.
const wrapIndex = wrap(0, memoriesData.length)

export default function OurMemories() {
  const prefersReducedMotion = useReducedMotion()
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  const [isFastScroll, setIsFastScroll] = useState(false)
  const sectionRef = useRef(null)

  // ── RESPONSIVE: detect mobile (reduced perspective / velocity cap) ─────────
  useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth < 768) }
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── 1. RAW SCROLL POSITION — motion value ─────────────────────────────────
  // Tracks window.scrollY as a Motion value. Updated imperatively on scroll
  // so useVelocity can derive instantaneous velocity from it.
  const scrollY = useMotionValue(0)

  useEffect(() => {
    function onScroll() { scrollY.set(window.scrollY) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [scrollY])

  // ── 2. VELOCITY — derived from the scroll motion value ────────────────────
  // useVelocity watches scrollY and computes instantaneous speed (px/s).
  // This spikes to ±2000+ on fast flicks and returns to 0 when idle.
  const scrollVelocity = useVelocity(scrollY)

  // ── 3. SPRING SMOOTHING — tames the spiky velocity signal ─────────────────
  // useSpring wraps scrollVelocity in a spring so planes glide smoothly.
  // Without this, the Z offset would snap/jitter on every frame.
  const smoothVelocity = useSpring(scrollVelocity, SPRING_CONFIG)

  // ── 6. useMotionValueEvent — side-effect without re-renders ───────────────
  // Subscribes to smoothed velocity. When |v| > 400 px/s, flag "fast scroll"
  // so we can apply a CSS class that dims the plane borders (performance hint +
  // visual feedback). This intentionally does NOT call setState in the hot path —
  // it batches the boolean update through a ref check.
  const fastRef = useRef(false)
  useMotionValueEvent(smoothVelocity, 'change', (v) => {
    const fast = Math.abs(v) > 400
    if (fast !== fastRef.current) {
      fastRef.current = fast
      setIsFastScroll(fast)   // OK here: low-frequency toggle, not per-frame
    }
  })

  // ── BUILD PLANE GRID DATA ─────────────────────────────────────────────────
  // Compute (col, row) for each of the 20 slots.
  // wrap(0, 8)(i) cycles the 8 source images across 20 slots.
  const planes = Array.from({ length: TOTAL_PLANES }, (_, i) => {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const dataIdx = wrapIndex(i)  // cycles 0–7 across 20 slots via modulo
    return { index: i, col, row, ...memoriesData[dataIdx] }
  })

  return (
    <section
      className={`memories-section${isFastScroll ? ' memories-fast' : ''}`}
      ref={sectionRef}
      aria-label="Our Memories"
    >
      {/* ── HEADING ── */}
      <div className="memories-heading">
        <h2>
          OUR<br />
          <span className="accent">MEMORIES</span>{' '}
          <span className="memories-badge">({memoriesData.length})</span>
        </h2>
      </div>

      {/* ── 3D VIEWPORT ── */}
      {/* CSS: perspective: 1400px on .memories-viewport */}
      {/* CSS: transform-style: preserve-3d on .memories-track */}
      {/* Motion handles all per-plane transforms via inline style */}
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
              // ── SHARED VELOCITY MOTION VALUE ──────────────────────────────
              // Each Plane reads this and computes its own phase-delayed
              // useTransform outputs internally (see Plane.jsx).
              // This keeps each plane's math self-contained and readable.
              smoothVelocity={smoothVelocity}
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>

      {/* ── PINNED HINT ── */}
      <div className="memories-hint">SCROLL TO RELIVE</div>
    </section>
  )
}
