import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useLightbox } from '../hooks/useLightbox.js'
import GalleryEvent from '../components/gallery/GalleryEvent.jsx'
import Lightbox from '../components/gallery/Lightbox.jsx'
import OurMemories from '../components/gallery/OurMemories.jsx'
import { galleryData, memoriesImages } from '../data/galleryData.js'

export default function Gallery() {
  useDocumentTitle('Gallery')

  // Lightbox for the old memories card stack (kept for backward compat)
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

      {/* Lightbox (for any photo clicked) */}
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

      {/*
       * OurMemories — Motion.dev 3D scroll-velocity planes section.
       * Self-contained: uses useMotionValue / useVelocity / useSpring /
       * useTransform / useMotionValueEvent / AnimatePresence / stagger /
       * animate / wrap — all from the `motion` package.
       * Additive; does not touch GalleryFilters, GalleryEvent, or Lightbox.
       */}
      <OurMemories />
    </>
  )
}
