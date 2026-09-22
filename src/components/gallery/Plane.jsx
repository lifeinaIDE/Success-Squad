/**
 * Plane.jsx — Individual 3D plane card for OurMemories section.
 *
 * Physics mapping (each comment links the Motion API to its behavior):
 *  useTransform(smoothVelocity, ...)  → per-plane Z depth (phase-delayed ripple)
 *  useTransform(smoothVelocity, ...)  → per-plane Y drift (wave feel)
 *  useTransform(velocityDrift, ...)   → combines drift with base Y position
 *  AnimatePresence + motion.div       → caption animates in on hover, out on leave
 *  animate() imperative               → scramble-text character cycling on hover
 */
import { useState, useCallback, useRef } from 'react'
import {
  motion,
  useTransform,
  AnimatePresence,
  animate,
  useReducedMotion,
} from 'motion/react'

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'

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
  const scrambleRef = useRef(null)

  // useReducedMotion — when true, skip all velocity-driven motion
  const prefersReducedMotion = useReducedMotion()

  // ── GRID GEOMETRY ─────────────────────────────────────────────────────────
  const CARD_W = isMobile ? 160 : 220
  const CARD_H = isMobile ? 210 : 290
  const GAP_X  = isMobile ? 180 : 250
  const GAP_Y  = isMobile ? 200 : 270

  // Diagonal ascending layout centered around (0,0)
  // COLS = 4 (indices 0,1,2,3 -> center is 1.5)
  // ROWS = 5 (indices 0,1,2,3,4 -> center is 2)
  const baseX = (col - 1.5) * GAP_X
  const baseY = (row - 2) * GAP_Y + (col - 1.5) * (GAP_Y * 0.4)

  // Scattered per-plane base rotations for the stacked-card look
  const baseRotate  = ((index % 7) - 3) * 2.5   // –7.5° to +7.5°
  const baseRotateY = ((index % 5) - 2) * 4      // –8°   to +8°

  // ── PHASE-DELAYED VELOCITY INPUT RANGE ────────────────────────────────────
  // Each plane shifts its velocity input range outward by (index * 2).
  // Plane 0 responds first at ±1200 px/s. Plane 19 responds at ±1238 px/s.
  // This tiny stagger makes the ripple PROPAGATE across the grid,
  // not every card moving at the exact same moment.
  const phaseShift = index * 2
  const lo = -1200 - phaseShift
  const hi =  1200 + phaseShift
  const maxZ    = isMobile ? 50 : 100
  const driftAmt = isMobile ? 15 : 30

  // useTransform #1: velocity → translateZ (retreat into depth on fast scroll)
  // Output is [0,0,0] when reduced motion is preferred → no-op
  const velocityZ = useTransform(
    smoothVelocity,
    [lo, 0, hi],
    prefersReducedMotion ? [0, 0, 0] : [-maxZ, 0, -maxZ],
  )

  // useTransform #2: velocity → Y drift amount (raw drift, centred at 0)
  const rawDrift = useTransform(
    smoothVelocity,
    [lo, 0, hi],
    prefersReducedMotion ? [0, 0, 0] : [driftAmt, 0, -driftAmt],
  )

  // useTransform #3: adds the static baseY to the drift motion value
  // so the final Y position = baseY + drift (both are numbers, output is MotionValue)
  // This is called unconditionally at top level — respects Rules of Hooks.
  const composedY = useTransform(rawDrift, (drift) => baseY + drift)

  // ── SCRAMBLE-TEXT on hover ────────────────────────────────────────────────
  // animate() drives a counter 0 → caption.length. onUpdate progressively
  // replaces random characters with the correct final character — scramble effect.
  const startScramble = useCallback(() => {
    if (prefersReducedMotion || !captionRef.current) return
    if (scrambleRef.current) scrambleRef.current.stop()

    const target = caption
    let chars = Array.from({ length: target.length }, () => ' ')

    scrambleRef.current = animate(0, target.length, {
      duration: 0.55,
      ease: 'easeOut',
      onUpdate(v) {
        const resolved = Math.floor(v)
        chars = chars.map((_, i) =>
          i < resolved
            ? target[i]  // finalized character
            : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
        )
        if (captionRef.current) captionRef.current.textContent = chars.join('')
      },
      onComplete() {
        if (captionRef.current) captionRef.current.textContent = target
      },
    })
  }, [caption, prefersReducedMotion])

  const stopScramble = useCallback(() => {
    if (scrambleRef.current) { scrambleRef.current.stop(); scrambleRef.current = null }
    if (captionRef.current) captionRef.current.textContent = caption
  }, [caption])

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="memories-plane"
      style={{
        width: CARD_W,
        height: CARD_H,
        // Center the card exactly in the middle before x/y transforms
        left: '50%',
        top: '50%',
        marginLeft: -CARD_W / 2,
        marginTop: -CARD_H / 2,
        x: baseX,
        // composedY = baseY + velocity drift (MotionValue)
        y: composedY,
        // translateZ drives the Z-depth ripple effect
        translateZ: velocityZ,
        rotateY: baseRotateY,
        rotate: baseRotate,
      }}
      // Entrance stagger: each plane fades/scales in with a delay proportional to index
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: prefersReducedMotion ? 0 : index * 0.04,
        duration: prefersReducedMotion ? 0.01 : 0.55,
        ease: [0.16, 1, 0.3, 1],
      }}
      // Hover: straighten rotation, scale up (Z handled by translateZ in style)
      whileHover={{
        scale: 1.1,
        rotateY: 0,
        rotate: baseRotate * 0.2,
        transition: { duration: 0.25, ease: 'easeOut' },
      }}
      onHoverStart={() => { setHovered(true);  startScramble() }}
      onHoverEnd  ={() => { setHovered(false); stopScramble()  }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />

      <span className="memories-index">
        {String(index).padStart(2, '0')}
      </span>

      {/* AnimatePresence ensures the caption fully animates OUT before unmounting */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            className="memories-caption"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <span ref={captionRef}>{caption}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
