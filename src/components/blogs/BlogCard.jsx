import { Link } from 'react-router-dom'

export default function BlogCard({ blog }) {
  const { slug, title, excerpt, category, coverImage, readTime, date, author, tags } = blog

  return (
    <article className="blog-card">
      <Link to={`/blogs/${slug}`} className="blog-card-media-link" aria-label={`Read article: ${title}`}>
        <div className="blog-card-media">
          <img
            src={coverImage}
            alt={title}
            className="blog-card-img"
            loading="lazy"
          />
          <span className="blog-card-badge">{category}</span>
        </div>
      </Link>

      <div className="blog-card-body">
        <div className="blog-card-meta">
          <span className="blog-meta-date">{date}</span>
          <span className="blog-meta-dot" aria-hidden="true">•</span>
          <span className="blog-meta-time">{readTime}</span>
        </div>

        <h3 className="blog-card-title">
          <Link to={`/blogs/${slug}`} className="blog-title-link">
            {title}
          </Link>
        </h3>

        <p className="blog-card-excerpt">{excerpt}</p>

        {tags && tags.length > 0 && (
          <div className="blog-card-tags">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="blog-tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="blog-card-footer">
          <div className="blog-author-info">
            <img
              src={author.avatar}
              alt={author.name}
              className="blog-author-avatar"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
            <div className="blog-author-text">
              <span className="blog-author-name">{author.name}</span>
              <span className="blog-author-role">{author.role}</span>
            </div>
          </div>

          <Link to={`/blogs/${slug}`} className="blog-read-more" aria-label={`Read ${title}`}>
            Read <span className="arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
