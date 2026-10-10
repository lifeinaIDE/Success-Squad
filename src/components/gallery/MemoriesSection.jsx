import { useEffect, useRef } from 'react'
import { memoriesImages } from '../../data/galleryData.js'

/**
 * MemoriesSection — "Our Memories" diagonal cascade at the end of Gallery.
 * Scroll behavior and card positioning match memories.js from the original site.
 */
export default function MemoriesSection() {
  const stackRef = useRef(null)
  const sectionRef = useRef(null)

  const N = memoriesImages.length

  // Apply initial absolute positions based on formula from memories.js
  useEffect(() => {
    const cards = stackRef.current?.querySelectorAll('.memories-card')
    if (!cards) return

    cards.forEach((card, i) => {
      const left = i * 90
      const top = (N - 1 - i) * 70
      const rotate = (i % 2 === 0 ? 1 : -1) * (3 + (i % 3))
      card.style.left = `${left}px`
      card.style.top = `${top}px`
      card.style.transform = `rotate(${rotate}deg)`
      card.style.zIndex = i
      card.style.transition = 'transform 0.3s ease'
    })

    const hovers = []
    cards.forEach((card, i) => {
      const rot = (i % 2 === 0 ? 1 : -1) * (3 + (i % 3))
      const enter = () => {
        card.style.transform = `rotate(${rot}deg) scale(1.05) translateY(-8px)`
        card.style.zIndex = 100
      }
      const leave = () => {
        card.style.transform = `rotate(${rot}deg)`
        card.style.zIndex = i
      }
      card.addEventListener('mouseenter', enter)
      card.addEventListener('mouseleave', leave)
      hovers.push({ card, enter, leave })
    })
    return () => hovers.forEach(({ card, enter, leave }) => {
      card.removeEventListener('mouseenter', enter)
      card.removeEventListener('mouseleave', leave)
    })
  }, [N])

  // Scroll drift applied to the whole stack wrapper
  useEffect(() => {
    let ticking = false
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          const rect = sectionRef.current?.getBoundingClientRect()
          if (!rect) { ticking = false; return }
          const delta = Math.max(0, window.innerHeight - rect.top)
          const offsetX = Math.min(150, delta * 0.15)
          const offsetY = Math.max(-150, -delta * 0.1)
          if (stackRef.current) {
            stackRef.current.style.transform = `translate(${offsetX}px, ${offsetY}px)`
          }
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section className="memories-section" ref={sectionRef}>
      <div className="memories-heading">
        <h2>
          OUR<br />
          <span className="accent">MEMORIES</span>
        </h2>
      </div>

      <div className="memories-stack" ref={stackRef}>
        {memoriesImages.map(({ id, src, alt }, i) => (
          <div key={id} className="memories-card">
            <span className="memories-card-index">{String(i).padStart(2, '0')}</span>
            <img src={src} alt={alt} loading="lazy" />
          </div>
        ))}
      </div>

      <div className="memories-scroll-hint">SCROLL TO RELIVE</div>
    </section>
  )
}
