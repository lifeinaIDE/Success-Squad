import { Link } from 'react-router-dom'

export default function FeaturedBlogCard({ blog }) {
  const { slug, title, excerpt, category, coverImage, readTime, date, author, tags } = blog

  return (
    <article className="featured-blog-card">
      <Link to={`/blogs/${slug}`} className="featured-blog-media-wrap" aria-label={`Read featured article: ${title}`}>
        <img
          src={coverImage}
          alt={title}
          className="featured-blog-img"
        />
        <div className="featured-blog-media-badge">
          <span className="featured-pill">⭐ Featured Story</span>
          <span className="category-pill">{category}</span>
        </div>
      </Link>

      <div className="featured-blog-content">
        <div className="blog-card-meta">
          <span className="blog-meta-date">{date}</span>
          <span className="blog-meta-dot" aria-hidden="true">•</span>
          <span className="blog-meta-time">{readTime}</span>
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
            <img
              src={author.avatar}
              alt={author.name}
              className="blog-author-avatar large"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
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
