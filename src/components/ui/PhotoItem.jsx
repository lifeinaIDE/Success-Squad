/**
 * PhotoItem — a single photo in the gallery grid.
 * Clicking it opens the lightbox for its event's photo set.
 *
 * @param {string}   src      - image src
 * @param {string}   alt      - alt text
 * @param {number}   index    - position within the current filtered set (for lightbox)
 * @param {function} onOpen   - callback(index) to open lightbox
 */
export default function PhotoItem({ src, alt, index, onOpen }) {
  return (
    <div
      className="photo-item"
      onClick={() => onOpen(index)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(index)}
      aria-label={`Open photo: ${alt}`}
    >
      <img src={src} alt={alt} loading="lazy" />
    </div>
  )
}
