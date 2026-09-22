/**
 * Plane.jsx — Individual 3D plane card for OurMemories section.
 *
 * Each Plane is a self-contained motion card that:
 *  1. Reads the shared smoothed velocity motion value from props
 *  2. Computes its own useTransform outputs (position + velocity offset)
 *     with a per-plane phase delay so the ripple propagates, not locksteps
 *  3. Lifts toward viewer on hover and shows an animated scramble-text caption
 *
 * Physics mapping:
 *  useTransform(smoothVelocity, ...)  → velocity → per-plane Z/Y offset (phase-delayed)
 *  useSpring                           → smooths the raw velocity (done in parent)
 *  AnimatePresence + motion.div        → caption mount/unmount animation
 *  animate (imperative)               → scramble-text character cycling on hover
 */
import { useState, useCallback, useRef } from 'react'
import {
  motion,
  useTransform,
  AnimatePresence,
  animate,
  useReducedMotion,
} from 'motion/react'

// Characters used for the scramble-text reveal on hover
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'

/**
 * @param {number}      index        - plane index (0-based), used for phase delay
 * @param {string}      src          - image src path
 * @param {string}      alt          - image alt text
 * @param {string}      caption      - text shown on hover (scramble-revealed)
 * @param {number}      col          - column position in the grid (0..3)
 * @param {number}      row          - row position in the grid (0..3)
 * @param {MotionValue} smoothVelocity  - shared spring-smoothed scroll velocity
 * @param {boolean}     isMobile     - reduces depth on small screens
 */
export default function Plane({
  index,
  src,
  alt,
  caption,
  col,
  row,
  smoothVelocity,
  isMobile,
}) {
  const [hovered, setHovered] = useState(false)
  const captionRef = useRef(null)
  const scrambleAnimRef = useRef(null)
  const prefersReducedMotion = useReducedMotion()

  // ── DIAGONAL LAYOUT ───────────────────────────────────────────────────────
  // Each plane is placed on a diagonal ascending grid.
  // col drives X, row drives Y — combined they create the staggered cascade.
  const CARD_W = isMobile ? 180 : 240
  const CARD_H = isMobile ? 240 : 320
  const GAP_X  = isMobile ? 200 : 270
  const GAP_Y  = isMobile ? 220 : 290
  // Diagonal offset: each column shifts up by half a row gap
  const baseX = col * GAP_X - (isMobile ? 60 : 100)
  const baseY = row * GAP_Y + col * (GAP_Y * 0.5) - (isMobile ? 80 : 120)

  // Slight per-plane base rotation for the scattered look
  const baseRotate = ((index % 7) - 3) * 2.5   // –7.5° … +7.5°
  const baseRotateY = ((index % 5) - 2) * 4     // –8° … +8°

  // ── VELOCITY → PER-PLANE 3D OFFSET ───────────────────────────────────────
  // useTransform maps the smoothed velocity into a Z/Y displacement.
  // Each plane applies a PHASE DELAY via a small stagger multiplier on
  // the input range — plane index 0 responds first, later planes lag behind.
  // This is how the "ripple propagates" rather than every card moving together.
  const phaseDelay = index * 3         // px — larger index = more lag in input space
  const maxDepth   = isMobile ? 60 : 120  // cap Z for mobile GPU safety

  // velocityZ: fast scroll → plane retreats into depth (negative Z)
  // useTransform: smoothVelocity value → output range for Z translation
  const velocityZ = useTransform(
    smoothVelocity,
    [-1500 + phaseDelay, 0, 1500 - phaseDelay],
    [-maxDepth, 0, -maxDepth],
  )

  // velocityY: fast scroll → slight vertical drift creates wave feel
  const velocityY = useTransform(
    smoothVelocity,
    [-1500 + phaseDelay, 0, 1500 - phaseDelay],
    [isMobile ? 20 : 40, 0, isMobile ? -20 : -40],
  )

  // ── HOVER: SCRAMBLE-TEXT CAPTION ─────────────────────────────────────────
  // On hover, imperatively animate a counter 0 → caption.length using Motion's
  // `animate()`. The onUpdate callback swaps random characters in until each
  // position resolves to the correct final character — a scramble effect.
  const startScramble = useCallback(() => {
    if (prefersReducedMotion || !captionRef.current) return
    // Cancel any in-progress scramble
    if (scrambleAnimRef.current) scrambleAnimRef.current.stop()

    const target = caption
    const len = target.length
    let output = Array(len).fill(' ')

    // animate() drives a plain number 0 → len over 0.6s
    // onUpdate fires every frame with the current progress value
    scrambleAnimRef.current = animate(0, len, {
      duration: 0.6,
      ease: 'easeOut',
      onUpdate(latest) {
        const resolved = Math.floor(latest)
        output = output.map((ch, i) => {
          if (i < resolved) return target[i]          // finalized
          // Still scrambling: pick a random character
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
        })
        if (captionRef.current) {
          captionRef.current.textContent = output.join('')
        }
      },
      onComplete() {
        if (captionRef.current) captionRef.current.textContent = target
      },
    })
  }, [caption, prefersReducedMotion])

  const stopScramble = useCallback(() => {
    if (scrambleAnimRef.current) {
      scrambleAnimRef.current.stop()
      scrambleAnimRef.current = null
    }
    // Snap caption to final text on leave
    if (captionRef.current) captionRef.current.textContent = caption
  }, [caption])

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="memories-plane"
      style={{
        width: CARD_W,
        height: CARD_H,
        // Base position drives the scattered diagonal layout
        x: baseX,
        y: prefersReducedMotion ? baseY : baseY,  // same; skip velocity below
        // Per-plane velocity offset (phase-delayed ripple)
        // In reduced-motion mode these values won't be wired up
        z: prefersReducedMotion ? 0 : velocityZ,
        rotateY: baseRotateY,
        rotate: baseRotate,
      }}
      // Entrance animation: planes fade + rise in with stagger
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: prefersReducedMotion ? 0 : index * 0.05,
        duration: prefersReducedMotion ? 0.01 : 0.6,
        ease: [0.16, 1, 0.3, 1],
      }}
      // Hover: lift toward viewer (positive Z), reduce rotations, scale up
      whileHover={{
        z: prefersReducedMotion ? 0 : 80,
        scale: 1.08,
        rotateY: 0,
        rotate: baseRotate * 0.3,
        transition: { duration: 0.3, ease: 'easeOut' },
      }}
      onHoverStart={() => {
        setHovered(true)
        startScramble()
      }}
      onHoverEnd={() => {
        setHovered(false)
        stopScramble()
      }}
    >
      {/* Photo */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />

      {/* Index badge — top-left corner */}
      <span className="memories-index">
        {String(index).padStart(2, '0')}
      </span>

      {/* Hover caption — AnimatePresence so it animates OUT on leave */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            className="memories-caption"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* captionRef.current is updated imperatively by the scramble loop */}
            <span ref={captionRef}>{caption}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
