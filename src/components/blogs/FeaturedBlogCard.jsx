import { Link } from 'react-router-dom'

export default function FeaturedBlogCard({ blog }) {
  const { slug, title, excerpt, readTime, date, author, tags } = blog

  return (
    <article className="featured-blog-card">
      <div className="featured-blog-content">
        <div className="featured-blog-topbar">
          <span className="featured-pill">⭐ Featured Story</span>
          <div className="blog-card-meta">
            <span className="blog-meta-date">{date}</span>
            <span className="blog-meta-dot" aria-hidden="true">•</span>
            <span className="blog-meta-time">{readTime}</span>
          </div>
        </div>

        <h2 className="featured-blog-title">
          <Link to={`/blogs/${slug}`} className="featured-title-link">
            {title}
          </Link>
        </h2>

        <p className="featured-blog-excerpt">{excerpt}</p>

        {tags && tags.length > 0 && (
          <div className="blog-card-tags">
            {tags.map((tag) => (
              <span key={tag} className="blog-tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="featured-blog-footer">
          <div className="blog-author-info">
            <div className="blog-author-monogram large" aria-hidden="true">
              {author.initials || author.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="blog-author-text">
              <span className="blog-author-name">{author.name}</span>
              <span className="blog-author-role">{author.role}</span>
            </div>
          </div>

          <Link to={`/blogs/${slug}`} className="btn btn-primary" id="featured-read-btn">
            Read Full Article →
          </Link>
        </div>
      </div>
    </article>
  )
}
