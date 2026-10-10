/**
 * Lightbox — full-screen photo overlay with prev/next navigation.
 * Keyboard (Escape, ArrowLeft, ArrowRight) and touch-swipe are handled
 * by useLightbox() in the parent. This component is purely presentational.
 *
 * @param {boolean}  isOpen        - whether the lightbox is visible
 * @param {Array}    photos        - array of { src, alt }
 * @param {number}   currentIndex  - index of the currently shown photo
 * @param {function} onClose       - close handler
 * @param {function} onNext        - next photo handler
 * @param {function} onPrev        - prev photo handler
 * @param {function} onTouchStart  - touchstart handler (from useLightbox)
 * @param {function} onTouchEnd    - touchend handler (from useLightbox)
 */
export default function Lightbox({
  isOpen,
  photos,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  onTouchStart,
  onTouchEnd,
}) {
  if (!isOpen) return null

  const photo = photos[currentIndex]
  const total = photos.length

  return (
    <div
      className="lightbox-overlay"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label="Photo lightbox"
    >
      {/* Prevent click-through on the inner content */}
      <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
        <button
          className="lightbox-close"
          onClick={onClose}
          aria-label="Close lightbox"
        >
          ✕
        </button>

        <button
          className="lightbox-prev"
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          aria-label="Previous photo"
        >
          &#10094;
        </button>

        <img src={photo.src} alt={photo.alt} className="lightbox-img" />

        <button
          className="lightbox-next"
          onClick={(e) => { e.stopPropagation(); onNext() }}
          aria-label="Next photo"
        >
          &#10095;
        </button>

        <div className="lightbox-counter">
          {currentIndex + 1} / {total}
        </div>
      </div>
    </div>
  )
}
