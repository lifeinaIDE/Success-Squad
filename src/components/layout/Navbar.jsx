import { useState, useEffect, useRef } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { useScrolled } from '../../hooks/useScrolled.js'
import { navLinks } from '../../data/navData.js'

/**
 * Navbar — single source of truth for site navigation.
 *
 * Hamburger behaviors preserved from main.js:
 *  1. Click-outside-to-close
 *  2. Close on nav link click (via useLocation route change)
 *  3. Close on resize past 1024px
 *  4. Body overflow lock while open
 *  5. .active class toggles the span rotate→X animation
 */
export default function Navbar() {
  const scrolled = useScrolled(20)
  const [open, setOpen] = useState(false)
  const navRef = useRef(null)
  const location = useLocation()

  // Close menu on route change
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  // Close on resize > 1024px
  useEffect(() => {
    function onResize() {
      if (window.innerWidth > 1024) setOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Click-outside to close
  useEffect(() => {
    function onDocClick(e) {
      if (open && navRef.current && !navRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [open])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function toggleMenu(e) {
    e.stopPropagation()
    setOpen((v) => !v)
  }

  return (
    <nav
      ref={navRef}
      className={`navbar${scrolled ? ' scrolled' : ''}`}
      id="navbar"
    >
      <div className="nav-logo">
        <Link to="/">
          <img 
            src="/Success Squad.jpg" 
            alt="Success Squad Logo" 
            style={{ height: '40px', width: 'auto', display: 'block', borderRadius: '4px' }} 
          />
        </Link>
      </div>

      <div
        className={`hamburger${open ? ' active' : ''}`}
        id="hamburger"
        onClick={toggleMenu}
        role="button"
        tabIndex={0}
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={open}
        onKeyDown={(e) => e.key === 'Enter' && toggleMenu(e)}
      >
        <span /><span /><span />
      </div>

      <ul className={`nav-links${open ? ' open' : ''}`} id="navLinks">
        {navLinks.map(({ id, label, to }) => (
          <li key={id}>
            <NavLink
              to={to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {label}
            </NavLink>
          </li>
        ))}
        <li>
          <NavLink
            to="/contact"
            className={({ isActive }) => `nav-link nav-cta${isActive ? ' active' : ''}`}
          >
            Get Involved
          </NavLink>
        </li>
      </ul>
    </nav>
  )
}
