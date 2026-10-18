import { Link } from 'react-router-dom'

export default function BlogCard({ blog }) {
  const { slug, title, excerpt, readTime, date, author, tags } = blog

  return (
    <article className="blog-card">
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
            <div className="blog-author-monogram" aria-hidden="true">
              {author.initials || author.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="blog-author-text">
              <span className="blog-author-name">{author.name}</span>
              <span className="blog-author-role">{author.role}</span>
            </div>
          </div>

          <Link to={`/blogs/${slug}`} className="blog-read-more" aria-label={`Read ${title}`}>
            Read Story <span className="arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
