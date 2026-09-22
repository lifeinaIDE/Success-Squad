/**
 * OurMemories.jsx — "Our Memories" 3D scroll-linked diagonal stack.
 *
 * Implements an infinite scroll effect where 16 image planes are positioned
 * in a diagonal 3D line. As the user scrolls through the 400vh section,
 * the active focus shifts along the stack, pulling the cards forward towards
 * the viewer and pushing them off-screen.
 */
import { useRef, useState, useEffect } from 'react'
import {
  motion,
  useScroll,
  useSpring,
  useReducedMotion,
  wrap,
} from 'motion/react'
import Plane from './Plane.jsx'
import { memoriesData } from '../../data/memoriesData.js'

const TOTAL_PLANES = 16 // Number of cards in the stack
const wrapIndex = wrap(0, memoriesData.length)

export default function OurMemories() {
  const prefersReducedMotion = useReducedMotion()
  const sectionRef = useRef(null)
  
  // Safe window size initialization
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── 1. SCROLL TRACKING ────────────────────────────────────────────────────
  // Track scroll progress of this specific section.
  // When the top of the section hits the top of viewport -> 0.
  // When the bottom of the section hits the bottom of viewport -> 1.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  })

  // ── 2. SPRING SMOOTHING ───────────────────────────────────────────────────
  // Smooth the scroll progress so the 3D stack glides beautifully instead
  // of rigidly sticking to the exact scroll pixel.
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 400,
    damping: 60,
    mass: 0.5
  })

  // ── BUILD PLANE STACK ─────────────────────────────────────────────────────
  // Cycle through the 8 source images up to 16 total cards.
  const planes = Array.from({ length: TOTAL_PLANES }, (_, i) => {
    const dataIdx = wrapIndex(i)
    return { index: i, ...memoriesData[dataIdx] }
  })

  return (
    <section
      ref={sectionRef}
      className="memories-section"
      aria-label="Our Memories"
    >
      {/* 
        3D Viewport — sticky so it stays on screen while the parent section 
        scrolls. Perspective is handled in CSS.
      */}
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
              total={TOTAL_PLANES}
              src={src}
              alt={alt}
              caption={caption}
              progress={smoothProgress}
              isMobile={isMobile}
              prefersReducedMotion={prefersReducedMotion}
            />
          ))}
        </div>

        <div className="memories-hint">SCROLL TO SURF</div>
      </div>
    </section>
  )
}
