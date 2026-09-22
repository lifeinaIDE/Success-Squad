/**
 * Plane.jsx — Individual 3D plane card for the diagonal stack.
 *
 * Cards are laid out in a static 3D diagonal line.
 * When the user scrolls, `smoothVelocity` provides a gentle drift effect
 * to the cards, pulling them slightly forward/backward based on scroll speed.
 */
import { motion, useTransform, AnimatePresence, useReducedMotion } from 'motion/react'
import { useState, useRef, useCallback } from 'react'

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'

export default function Plane({
  index,
  src,
  alt,
  caption,
  smoothVelocity,
  isMobile,
  prefersReducedMotion,
}) {
  const [hovered, setHovered] = useState(false)
  const captionRef = useRef(null)

  // ── SIZING ────────────────────────────────────────────────────────────────
  const CARD_W = isMobile ? 180 : 320
  const CARD_H = isMobile ? 240 : 420

  // ── 3D POSITIONING ALONG THE DIAGONAL ─────────────────────────────────────
  // The cards are placed statically based on their index (0 to 15).
  // Index 0 is bottom-left (closest). Index 15 is top-right (furthest).
  
  // Base offset to anchor the front card near the bottom-left.
  const BASE_X = isMobile ? -60 : -250
  const BASE_Y = isMobile ? 120 : 180

  // Per-index spacing increments
  const STEP_Z = isMobile ? 150 : 250  // Depth between cards
  const STEP_X = isMobile ? 80 : 160   // Horizontal shift per card
  const STEP_Y = isMobile ? -50 : -80  // Vertical shift per card (negative = up)

  const staticX = BASE_X + index * STEP_X
  const staticY = BASE_Y + index * STEP_Y
  const staticZ = prefersReducedMotion ? 0 : -index * STEP_Z

  // ── VELOCITY DRIFT ────────────────────────────────────────────────────────
  // When scrolling fast, the entire stack shifts slightly in Z and Y.
  // We phase-delay it slightly by index so it feels like a wave.
  const phaseDelay = index * 2
  const lo = -1200 - phaseDelay
  const hi = 1200 + phaseDelay

  // velocityZ: Fast scroll pushes the cards back or pulls them forward
  const velocityZ = useTransform(
    smoothVelocity,
    [lo, 0, hi],
    prefersReducedMotion ? [0, 0, 0] : [-100, 0, -100]
  )
  
  const finalZ = useTransform(velocityZ, (vz) => staticZ + vz)

  // velocityY: Subtle vertical drift
  const velocityY = useTransform(
    smoothVelocity,
    [lo, 0, hi],
    prefersReducedMotion ? [0, 0, 0] : [30, 0, -30]
  )

  const finalY = useTransform(velocityY, (vy) => staticY + vy)

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="memories-plane"
      style={{
        width: CARD_W,
        height: CARD_H,
        // Center origin at 0,0 for perfect 3D perspective
        left: '50%',
        top: '50%',
        marginLeft: -CARD_W / 2,
        marginTop: -CARD_H / 2,
        x: staticX,
        y: finalY,
        translateZ: finalZ,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      whileHover={{
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {/* Index badge positioned slightly outside the image. */}
      <span className="memories-index">
        {String(index).padStart(2, '0')}
      </span>

      {/* The Image */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="memories-img"
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
      />

      {/* Caption — simple fade-in on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            className="memories-caption"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
          >
            {caption}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
