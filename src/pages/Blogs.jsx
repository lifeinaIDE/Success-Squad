import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { blogsData } from '../data/blogsData.js'
import BlogCard from '../components/blogs/BlogCard.jsx'
import FeaturedBlogCard from '../components/blogs/FeaturedBlogCard.jsx'

export default function Blogs() {
  useDocumentTitle('Blogs & Founder Insights')

  const [searchQuery, setSearchQuery] = useState('')

  // Identify featured article
  const featuredBlog = useMemo(() => {
    return blogsData.find((b) => b.featured) || blogsData[0]
  }, [])

  // Filtered articles based on search query
  const filteredBlogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return blogsData

    return blogsData.filter((b) => {
      return (
        b.title.toLowerCase().includes(q) ||
        b.excerpt.toLowerCase().includes(q) ||
        b.author.name.toLowerCase().includes(q) ||
        (b.tags && b.tags.some((t) => t.toLowerCase().includes(q)))
      )
    })
  }, [searchQuery])

  return (
    <>
      <Helmet>
        <title>Blogs & Founder Insights | Success Squad EDC</title>
        <meta
          name="description"
          content="Explore actionable founder playbooks, student startup stories, hackathon tactics, and pitching guides from Success Squad EDC at TSSM & JSPM NTC."
        />
        <meta property="og:title" content="Blogs & Founder Insights | Success Squad" />
        <meta
          property="og:description"
          content="Guides, founder stories, and tactical advice from TSSM & JSPM NTC's Entrepreneurship Development Cell."
        />
      </Helmet>

      {/* Page Header */}
      <div className="page-header">
        <div className="section-label">Knowledge Hub</div>
        <h1>
          Insights, Ideas &amp; <span className="accent">Ventures</span>
        </h1>
        <p>
          Actionable founder playbooks, student venture breakdowns, hackathon tactics,
          and entrepreneurial wisdom from the builders at Success Squad.
        </p>
      </div>

      <div className="blogs-page-container">
        {/* Search Bar */}
        <div className="blogs-filter-bar no-categories">
          <div className="blogs-search-wrap full-width">
            <span className="blogs-search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              className="blogs-search-input"
              placeholder="Search articles, keywords, tags, authors…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search articles"
            />
            {searchQuery && (
              <button
                className="blogs-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Featured Post Spotlight (shown when not actively searching) */}
        {!searchQuery && featuredBlog && (
          <section className="featured-blog-section" aria-label="Featured Story">
            <FeaturedBlogCard blog={featuredBlog} />
          </section>
        )}

        {/* All Articles Grid Section */}
        <section className="blogs-grid-section" aria-label="Articles Feed">
          <div className="blogs-section-header">
            <div>
              <span className="section-label">
                {searchQuery ? `Search Results (${filteredBlogs.length})` : 'All Articles'}
              </span>
              <h2 className="section-title" style={{ fontSize: '1.75rem', marginTop: '4px' }}>
                {searchQuery ? `Articles matching "${searchQuery}"` : 'Latest Publications'}
              </h2>
            </div>
            <span className="blogs-count-badge">
              {filteredBlogs.length} {filteredBlogs.length === 1 ? 'Article' : 'Articles'}
            </span>
          </div>

          {filteredBlogs.length === 0 ? (
            <div className="blogs-empty-state">
              <span className="empty-icon" aria-hidden="true">📝</span>
              <h3>No articles found</h3>
              <p>We couldn't find any articles matching your search query.</p>
              <button
                className="btn btn-ghost"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="blogs-grid">
              {filteredBlogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
          )}
        </section>

        {/* Write For Us CTA */}
        <section className="blogs-cta-strip">
          <div className="blogs-cta-content">
            <span className="section-label" style={{ color: 'var(--accent-warm)' }}>
              Call For Writers
            </span>
            <h2>
              Have a startup story or <span className="accent">technical insight</span> to share?
            </h2>
            <p>
              We feature guest contributions from student founders, engineers, alumni, and industry mentors.
              Share your learnings with over 2,000+ ambitious innovators in our campus ecosystem.
            </p>
            <div className="blogs-cta-actions">
              <Link to="/contact" className="btn btn-primary">
                Submit an Article
              </Link>
              <Link to="/about" className="btn btn-ghost">
                About Success Squad →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
