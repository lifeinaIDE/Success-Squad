import { useState, useEffect, useCallback } from 'react'

/**
 * Manages lightbox state: open/close, prev/next navigation, keyboard + touch.
 * Preserves exact behavior from original gallery.js:
 *  - Escape closes
 *  - ArrowLeft/ArrowRight navigate
 *  - Touch swipe threshold: 50px
 *  - body scroll lock while open
 *  - index wraps around
 *
 * @param {number} total - total number of photos in the active set
 */
export function useLightbox(total) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const touchStartX = { current: 0 }

  const open = useCallback((index) => {
    setCurrentIndex(index)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const next = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % total)
  }, [total])

  const prev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + total) % total)
  }, [total])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    function onKey(e) {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close, next, prev])

  // Touch swipe handlers to attach to the lightbox wrapper
  const onTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const onTouchEnd = useCallback((e) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 50) {
      delta < 0 ? next() : prev()
    }
  }, [next, prev])

  return { isOpen, currentIndex, open, close, next, prev, onTouchStart, onTouchEnd }
}
