import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useLightbox } from '../hooks/useLightbox.js'
import GalleryEvent from '../components/gallery/GalleryEvent.jsx'
import Lightbox from '../components/gallery/Lightbox.jsx'
import { galleryData, memoriesImages } from '../data/galleryData.js'
import { useEffect, useRef } from 'react'

/**
 * MemoriesSection — "Our Memories" diagonal cascade.
 * Scroll drift + hover lift match the original memories.js behavior.
 */
function MemoriesSection() {
  const sectionRef = useRef(null)
  const stackRef = useRef(null)
  const N = memoriesImages.length

  useEffect(() => {
    const cards = stackRef.current?.querySelectorAll('.memories-card')
    if (!cards) return

    const hovers = []
    cards.forEach((card, i) => {
      const left = i * 90
      const top = (N - 1 - i) * 70
      const rot = (i % 2 === 0 ? 1 : -1) * (3 + (i % 3))
      card.style.left = `${left}px`
      card.style.top = `${top}px`
      card.style.transform = `rotate(${rot}deg)`
      card.style.zIndex = i
      card.style.transition = 'transform 0.3s ease'

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

  useEffect(() => {
    let ticking = false
    function onScroll() {
      if (ticking) return
      ticking = true
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
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section className="memories-section" ref={sectionRef}>
      <div className="memories-heading">
        <h2>
          OUR<br />
          <span className="accent">MEMORIES</span>{' '}
          <span className="memories-badge">(8)</span>
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

export default function Gallery() {
  useDocumentTitle('Gallery')

  // Lightbox for memories photos
  const lb = useLightbox(memoriesImages.length)

  return (
    <>
      <div className="page-header">
        <div className="section-label">Gallery</div>
        <h1>Moments to <span className="accent">remember.</span></h1>
        <p>A visual journey through our hackathons, workshops, and fests.</p>
      </div>

      {/* Event carousels */}
      {galleryData.map((event) => (
        <GalleryEvent key={event.id} {...event} />
      ))}

      {/* Our Memories diagonal cascade */}
      <MemoriesSection />

      {/* Lightbox (for any photo clicked in memories) */}
      <Lightbox
        isOpen={lb.isOpen}
        photos={memoriesImages}
        currentIndex={lb.currentIndex}
        onClose={lb.close}
        onNext={lb.next}
        onPrev={lb.prev}
        onTouchStart={lb.onTouchStart}
        onTouchEnd={lb.onTouchEnd}
      />
    </>
  )
}
