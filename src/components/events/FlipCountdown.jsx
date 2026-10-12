/**
 * FlipCountdown.jsx - Split-flap mechanical flip-clock countdown timer for E-Fest '26.
 *
 * Target: 26 October 2026, 12:00 PM IST (2026-10-26T12:00:00+05:30)
 * Uses exact ISO 8601 with +05:30 offset so it works accurately in every timezone.
 */
import { useState, useEffect, useRef } from 'react'

/**
 * Single source of truth for the E-Fest '26 registration deadline:
 * 26 October 2026, 12:00 PM IST (2026-10-26T12:00:00+05:30).
 *
 * NOTE ON DEADLINE ENFORCEMENT & SECURITY (Requirement 5):
 * This deadline evaluation is client-side using Date.now().
 * Because a visitor's device clock may drift or be intentionally changed,
 * a true security cutoff requires server-side validation (e.g. Supabase/Postgres
 * RPC check or Firebase Security Rules timestamp check) to reject late submissions.
 * If external forms are used (e.g. Google Forms or Unstop for CraftCode),
 * remember to also set the response cutoff / closing date directly in that form's settings.
 */
export const REGISTRATION_DEADLINE = '2026-10-26T12:00:00+05:30'
export const REGISTRATION_DEADLINE_DATE = new Date(REGISTRATION_DEADLINE)
export const REGISTRATION_DEADLINE_MS = REGISTRATION_DEADLINE_DATE.getTime()

/**
 * Single source of truth for the E-Fest '26 registration page route/URL.
 */
export const FEST_SLUG = import.meta.env.VITE_FEST_SLUG || 'e-fest-26'
export const REGISTRATION_URL = `/fest/${FEST_SLUG}`

/**
 * Helper to check if registration has closed against the single source of truth deadline.
 */
export function isRegistrationClosed(targetMs = REGISTRATION_DEADLINE_MS) {
  return Date.now() >= targetMs
}

/**
 * Calculates remaining days, hours, minutes, and seconds until the target date.
 * Clamps diff to 0 so digits never become negative.
 */
function getTimeLeft(targetTimestamp) {
  const diff = Math.max(0, targetTimestamp - Date.now())
  const isClosed = diff <= 0
  const isUrgent = !isClosed && diff < 24 * 60 * 60 * 1000

  const d = Math.floor(diff / (1000 * 60 * 60 * 24))
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const m = Math.floor((diff / (1000 * 60)) % 60)
  const s = Math.floor((diff / 1000) % 60)

  return {
    isClosed,
    isUrgent,
    isLive: isClosed, // preserved for backward-compatibility
    days: String(d).padStart(2, '0'),
    hours: String(h).padStart(2, '0'),
    minutes: String(m).padStart(2, '0'),
    seconds: String(s).padStart(2, '0'),
  }
}

/**
 * Single flip-card unit.
 * Uses 3D transforms (rotateX) with top and bottom split-halves to mimic
 * a real mechanical flip board when values transition.
 */
function FlipUnit({ value, label, isSeconds = false }) {
  const [currentVal, setCurrentVal] = useState(value)
  const [previousVal, setPreviousVal] = useState(value)
  const [flipping, setFlipping] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (value !== currentVal) {
      setPreviousVal(currentVal)
      setFlipping(true)

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setCurrentVal(value)
        setFlipping(false)
      }, 560)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [value, currentVal])

  return (
    <div
      className={`flip-unit${isSeconds ? ' flip-unit-seconds' : ''}`}
      aria-label={`${label}: ${value}`}
    >
      <div className={`flip-card ${flipping ? 'is-flipping' : ''}`}>
        {/* Static Upper Background (shows incoming value as top flap folds) */}
        <div className="flip-half flip-upper flip-bg">
          <span className="flip-digit">{value}</span>
        </div>

        {/* Static Lower Background (shows previous value until bottom flap drops) */}
        <div className="flip-half flip-lower flip-bg">
          <span className="flip-digit">{flipping ? previousVal : currentVal}</span>
        </div>

        {/* Dynamic 3D Flaps during rotation */}
        {flipping && (
          <>
            <div className="flip-half flip-upper flip-flap-top">
              <span className="flip-digit">{previousVal}</span>
            </div>
            <div className="flip-half flip-lower flip-flap-bottom">
              <span className="flip-digit">{value}</span>
            </div>
          </>
        )}

        {/* Center horizontal split groove */}
        <div className="flip-card-divider" />
      </div>

      {/* Label under the card */}
      <div className="flip-unit-label">{label}</div>
    </div>
  )
}

export default function FlipCountdown({
  targetDate = REGISTRATION_DEADLINE,
  onStatusChange,
  onExpire,
}) {
  const targetTime = useRef(new Date(targetDate).getTime()).current
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetTime))

  useEffect(() => {
    // Notify on mount (synchronous status check for page load)
    if (onStatusChange) {
      onStatusChange(timeLeft)
    }

    if (timeLeft.isClosed) {
      if (onExpire) onExpire()
      return
    }

    const interval = setInterval(() => {
      const remaining = getTimeLeft(targetTime)
      setTimeLeft(remaining)

      if (onStatusChange) {
        onStatusChange(remaining)
      }

      if (remaining.isClosed) {
        if (onExpire) onExpire()
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [targetTime, onStatusChange, onExpire, timeLeft.isClosed])

  const countdownClasses = [
    'efest-countdown',
    timeLeft.isClosed ? 'is-closed' : '',
    timeLeft.isUrgent ? 'timer-urgent' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={countdownClasses}
      aria-label="E-Fest '26 Countdown Timer"
    >
      {/* Label above timer: "REGISTRATION CLOSES IN" or "REGISTRATIONS CLOSED" */}
      <div className={`efest-countdown-header${timeLeft.isClosed ? ' is-closed' : ''}`}>
        <span className="efest-countdown-dot" aria-hidden="true" />
        <span className="efest-countdown-label">
          {timeLeft.isClosed ? 'REGISTRATIONS CLOSED' : 'REGISTRATION CLOSES IN'}
        </span>
      </div>

      {/* Four flip cards in a single row */}
      <div className="flip-board" role="timer" aria-live="off">
        <FlipUnit value={timeLeft.days} label="DAYS" />
        <FlipUnit value={timeLeft.hours} label="HOURS" />
        <FlipUnit value={timeLeft.minutes} label="MINUTES" />
        <FlipUnit value={timeLeft.seconds} label="SECONDS" isSeconds />
      </div>
    </div>
  )
}
