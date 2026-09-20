import { useState } from 'react'

/**
 * GalleryCarousel — a single event's photo carousel with prev/next buttons and dot navigation.
 * Replaces the imperative updateCarousel/moveCarousel/jumpCarousel functions in the original gallery.html.
 */
export default function GalleryCarousel({ id, year, title, accentTitle, bg, slides }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  function move(dir) {
    setCurrentIndex((i) => (i + dir + slides.length) % slides.length)
  }

  function jump(i) {
    setCurrentIndex(i)
  }

  return (
    <section className="section" style={{ background: bg }}>
      <div className="section-label">{year}</div>
      <h2 className="section-title">
        {title} <span className="accent">{accentTitle}</span>
      </h2>

      <div className="carousel" id={`carousel-${id}`} data-index={currentIndex}>
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide, i) => (
            <div className="carousel-slide" key={i}>
              <img src={slide.src} alt={slide.alt} loading="lazy" />
            </div>
          ))}
        </div>

        <button
          className="carousel-btn prev"
          onClick={() => move(-1)}
          aria-label="Previous slide"
        >
          &#10094;
        </button>
        <button
          className="carousel-btn next"
          onClick={() => move(1)}
          aria-label="Next slide"
        >
          &#10095;
        </button>

        <div className="carousel-dots">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`dot${i === currentIndex ? ' active' : ''}`}
              onClick={() => jump(i)}
              role="button"
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
