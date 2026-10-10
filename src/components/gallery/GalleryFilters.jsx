/**
 * GalleryFilters — category filter button bar for the gallery page.
 * Preserves: active state, per-category photo count badges.
 *
 * @param {Array}    filters        - array of { id, label, count }
 * @param {string}   activeFilter   - currently active filter id
 * @param {function} onFilter       - callback(filterId)
 */
export default function GalleryFilters({ filters, activeFilter, onFilter }) {
  return (
    <div className="gallery-filters">
      {filters.map(({ id, label, count }) => (
        <button
          key={id}
          className={`filter-btn${activeFilter === id ? ' active' : ''}`}
          onClick={() => onFilter(id)}
          aria-pressed={activeFilter === id}
        >
          {label}
          <span className="filter-count">{count}</span>
        </button>
      ))}
    </div>
  )
}
