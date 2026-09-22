/**
 * Plane.jsx — Individual 3D plane card for the scroll-linked diagonal stack.
 *
 * Position maps directly to the user's scroll progress:
 *   - The stack is a continuous diagonal line in 3D space.
 *   - `dist` = index - activeIndex
 *   - Cards with dist > 0 are pushed back (negative Z), right (+X), and up (-Y).
 *   - Cards with dist < 0 are pulled towards/past the camera (+Z).
 */
import { motion, useTransform, AnimatePresence, useReducedMotion } from 'motion/react'
import { useState, useRef } from 'react'

export default function Plane({
  index,
  total,
  src,
  alt,
  caption,
  progress,
  isMobile,
  prefersReducedMotion,
}) {
  const [hovered, setHovered] = useState(false)

  // ── SIZING ────────────────────────────────────────────────────────────────
  const CARD_W = isMobile ? 240 : 420
  const CARD_H = isMobile ? 320 : 540

  // ── MATH: CONTINUOUS INDEX ────────────────────────────────────────────────
  // activeIndex ranges from 0 to (total - 1) based on scroll progress.
  const activeIndex = useTransform(progress, (p) => p * (total - 1))
  
  // dist represents how far this card is from being the "active" front card.
  // dist = 0: Active card (front)
  // dist = 1: Next card in sequence (behind)
  // dist = -1: Previous card (passed the camera)
  const dist = useTransform(activeIndex, (a) => index - a)

  // ── 3D POSITIONING ALONG THE DIAGONAL ─────────────────────────────────────
  // Base offset to anchor the active card (dist=0) near the bottom-left.
  const BASE_X = isMobile ? -20 : -350
  const BASE_Y = isMobile ? 80 : 180

  // Per-index spacing increments
  const STEP_Z = isMobile ? 250 : 350  // Depth between cards
  const STEP_X = isMobile ? 120 : 200  // Horizontal shift per card
  const STEP_Y = isMobile ? -80 : -120 // Vertical shift per card (negative = up)

  // Calculate final absolute translations based on `dist`
  const x = useTransform(dist, (d) => BASE_X + d * STEP_X)
  const y = useTransform(dist, (d) => BASE_Y + d * STEP_Y)
  
  // Z depth: negative pushes back into the screen. 
  // If prefersReducedMotion, we flat-stack them using scale instead? 
  // We'll keep Z for structure, but skip if strictly requested.
  const z = useTransform(dist, (d) => {
    if (prefersReducedMotion) return 0
    return -d * STEP_Z
  })

  // Opacity: 
  // - fade in rapidly right before passing camera (dist = -0.5)
  // - fully opaque at dist = 0
  // - slowly fade out deep in the background (dist > 8)
  const opacity = useTransform(
    dist,
    [-1.5, -0.5, 0, 6, 12],
    [0, 1, 1, 0.8, 0]
  )

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
        x,
        y,
        translateZ: z,
        opacity,
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {/* 
        Index badge positioned slightly outside the image.
        We removed overflow: hidden from the plane container in CSS
        so this badge can float freely.
      */}
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
