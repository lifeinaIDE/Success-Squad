/**
 * Single source of truth for the E-Fest '26 registration deadline:
 * 26 October 2026, 12:00 PM IST (2026-10-26T12:00:00+05:30).
 *
 * NOTE ON DEADLINE ENFORCEMENT & SECURITY:
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

