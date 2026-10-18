import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { blogsData } from '../data/blogsData.js'
import BlogCard from '../components/blogs/BlogCard.jsx'

export default function BlogPost() {
  const { slug } = useParams()
  const [copied, setCopied] = useState(false)

  const blog = blogsData.find((b) => b.slug === slug)

  useDocumentTitle(blog ? blog.title : 'Article Not Found')

  if (!blog) {
    return (
      <div className="blog-not-found-wrap">
        <div className="blog-not-found-card">
          <span className="not-found-icon" aria-hidden="true">📑</span>
          <h1>Article Not Found</h1>
          <p>The article you are looking for does not exist or has been moved.</p>
          <Link to="/blogs" className="btn btn-primary">
            ← Back to All Articles
          </Link>
        </div>
      </div>
    )
  }

  const { title, excerpt, readTime, date, author, tags, sections } = blog

  // Related articles (excluding current article)
  const relatedBlogs = blogsData
    .filter((b) => b.id !== blog.id)
    .slice(0, 3)

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const shareText = encodeURIComponent(`${title} — Read on Success Squad EDC: `)
  const shareUrl = encodeURIComponent(window.location.href)

  return (
    <>
      <Helmet>
        <title>{title} | Success Squad Blogs</title>
        <meta name="description" content={excerpt} />
        <meta property="og:title" content={`${title} | Success Squad`} />
        <meta property="og:description" content={excerpt} />
        <meta property="og:type" content="article" />
      </Helmet>

      <article className="blog-post-page">
        {/* Navigation Breadcrumb */}
        <div className="blog-post-nav-bar">
          <Link to="/blogs" className="blog-back-link">
            ← Back to All Articles
          </Link>
          <div className="blog-breadcrumbs">
            <Link to="/">Home</Link>
            <span className="crumb-sep">/</span>
            <Link to="/blogs">Blogs</Link>
            <span className="crumb-sep">/</span>
            <span className="crumb-current">Article</span>
          </div>
        </div>

        {/* Post Hero Header */}
        <header className="blog-post-header">
          <div className="blog-post-pills">
            <span className="blog-post-time-pill">{readTime}</span>
            <span className="blog-post-date-pill">{date}</span>
          </div>

          <h1 className="blog-post-title">{title}</h1>

          <p className="blog-post-lead">{excerpt}</p>

          {/* Author & Share Bar */}
          <div className="blog-author-strip">
            <div className="blog-author-info">
              <div className="blog-author-monogram large" aria-hidden="true">
                {author.initials || author.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="blog-author-text">
                <span className="blog-author-name">{author.name}</span>
                <span className="blog-author-role">{author.role}</span>
              </div>
            </div>

            <div className="blog-share-actions">
              <span className="share-label">Share:</span>
              <button
                className="share-btn copy-btn"
                onClick={handleCopyLink}
                title="Copy article link"
                aria-label="Copy article link"
              >
                {copied ? '✓ Copied' : '🔗 Link'}
              </button>
              <a
                href={`https://wa.me/?text=${shareText}${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-btn whatsapp-btn"
                aria-label="Share on WhatsApp"
                title="Share on WhatsApp"
              >
                WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-btn x-btn"
                aria-label="Share on X"
                title="Share on X"
              >
                𝕏 Post
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-btn linkedin-btn"
                aria-label="Share on LinkedIn"
                title="Share on LinkedIn"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </header>

        {/* Article Body Content */}
        <div className="blog-post-content-container">
          <div className="blog-post-body">
            {sections &&
              sections.map((sec, idx) => (
                <section key={idx} className="blog-body-section">
                  <h2 className="blog-section-heading">{sec.heading}</h2>

                  {sec.content.map((p, pIdx) => (
                    <p key={pIdx} className="blog-paragraph">
                      {p}
                    </p>
                  ))}

                  {sec.callout && (
                    <div className="blog-callout-box">
                      <div className="blog-callout-header">
                        <span className="callout-icon" aria-hidden="true">💡</span>
                        <h4 className="blog-callout-title">{sec.callout.title}</h4>
                      </div>
                      <p className="blog-callout-text">{sec.callout.text}</p>
                    </div>
                  )}
                </section>
              ))}

            {/* Author Bio Box */}
            <div className="blog-author-bio-card">
              <div className="blog-author-monogram xlarge" aria-hidden="true">
                {author.initials || author.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="blog-bio-text">
                <span className="bio-written-by">Written by</span>
                <h3 className="bio-author-name">{author.name}</h3>
                <p className="bio-author-role">{author.role}</p>
                <p className="bio-paragraph">{author.bio}</p>
              </div>
            </div>

            {/* Tags footer */}
            {tags && tags.length > 0 && (
              <div className="blog-post-tags-footer">
                <span className="tags-label">Tagged with:</span>
                <div className="tags-list">
                  {tags.map((t) => (
                    <span key={t} className="blog-tag large">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Articles Strip */}
        {relatedBlogs.length > 0 && (
          <section className="blog-related-section" aria-label="More Articles">
            <div className="blog-related-header">
              <span className="section-label">Keep Reading</span>
              <h2>More Insights &amp; Stories</h2>
            </div>
            <div className="blogs-grid">
              {relatedBlogs.map((b) => (
                <BlogCard key={b.id} blog={b} />
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  )
}
