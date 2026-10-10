import { useState } from 'react'

/**
 * GalleryEvent — a single event carousel section on the gallery page.
 * Replaces the imperative moveCarousel/jumpCarousel/updateCarousel DOM functions
 * from gallery.html's inline <script> with React state.
 *
 * @param {string} id           - unique carousel id
 * @param {string} year         - section label e.g. "2025"
 * @param {string} title        - title before accent part e.g. "E-Fest"
 * @param {string} accentTitle  - accent-coloured title part e.g. "2025"
 * @param {string} bg           - CSS background value for the section
 * @param {Array}  slides       - [{ src, alt }]
 */
export default function GalleryEvent({ id, year, title, accentTitle, bg, slides }) {
  const [index, setIndex] = useState(0)

  function move(dir) {
    setIndex((i) => (i + dir + slides.length) % slides.length)
  }

  function jump(i) {
    setIndex(i)
  }

  return (
    <section className="section" style={{ background: bg }}>
      <div className="section-label">{year}</div>
      <h2 className="section-title">
        {title} <span className="accent">{accentTitle}</span>
      </h2>

      <div className="carousel" id={`carousel-${id}`} data-index={index}>
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${index * 100}%)` }}
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
              className={`dot${i === index ? ' active' : ''}`}
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
