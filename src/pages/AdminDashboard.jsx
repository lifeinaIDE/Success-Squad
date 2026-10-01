/**
 * AdminDashboard.jsx — Protected admin route (Supabase Auth edition).
 *
 * Authentication: Supabase Auth email/password.
 * Only emails in ADMIN_EMAILS are allowed past the login screen.
 *
 * Features:
 *  - Login form (email + password via Supabase Auth)
 *  - Table of all registrations, filterable by event + status
 *  - Click row → detail drawer with optional screenshot + "Mark Verified" button
 *  - "Mark Verified" calls markVerified(), updates row live
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase }    from '../services/supabase.js'
import { listRegistrations, markVerified } from '../services/registrations.js'
import { efestEvents } from '../data/eventConfigs.js'

// Allowlisted admin emails — add yours here.
const ADMIN_EMAILS = new Set([
  'admin@successsquad.in',
  // add more as needed
])

// ── Login Form ───────────────────────────────────────────────────────────────
function LoginForm({ onLogin, error }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onLogin(email, password)
    setLoading(false)
  }

  return (
    <div className="admin-login-wrap">
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <h1 className="admin-login-title">Admin Login</h1>
        <p className="admin-login-sub">Success Squad — Internal Panel</p>

        {error && <p className="reg-error" role="alert">{error}</p>}

        <div className="form-group">
          <label htmlFor="admin-email">Email</label>
          <input id="admin-email" type="email" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="admin-pass">Password</label>
          <input id="admin-pass" type="password" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}

// ── Detail Drawer ────────────────────────────────────────────────────────────
function DetailDrawer({ reg, onClose, onVerify, verifying }) {
  if (!reg) return null
  const members = reg.team_data?.members ?? []
  return (
    <div className="admin-drawer-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="admin-drawer" role="dialog" aria-label="Registration detail">
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h3 className="admin-drawer-title">{reg.team_data?.teamName ?? '—'}</h3>
        <p className="admin-drawer-meta">Team ID: <strong>{reg.team_id}</strong></p>
        <p className="admin-drawer-meta">Event: <strong>{reg.event_id}</strong></p>
        <p className="admin-drawer-meta">Status: <strong className={`status-badge status-${reg.status}`}>{reg.status}</strong></p>
        <p className="admin-drawer-meta">
          Leader: {reg.team_data?.leaderName} · {reg.team_data?.leaderPhone} · {reg.team_data?.leaderEmail}
        </p>
        <p className="admin-drawer-meta">Payment ID: <code style={{ fontSize: '0.8rem' }}>{reg.razorpay_payment_id}</code></p>

        <h4 style={{ marginTop: 20, marginBottom: 8 }}>Members</h4>
        {members.map((m, i) => (
          <p key={i} className="admin-drawer-meta">M{i + 2}: {m.name} — {m.email}</p>
        ))}

        <h4 style={{ marginTop: 20, marginBottom: 8 }}>Payment Screenshot</h4>
        {reg.screenshot_url
          ? <a href={reg.screenshot_url} target="_blank" rel="noopener noreferrer">
              <img src={reg.screenshot_url} alt="Payment proof" className="admin-screenshot" />
            </a>
          : <p className="admin-drawer-meta" style={{ color: 'var(--text-muted)' }}>No screenshot uploaded.</p>
        }

        {reg.status !== 'verified' && (
          <button
            className="btn btn-primary"
            style={{ marginTop: 24, width: '100%' }}
            onClick={() => onVerify(reg.id)}
            disabled={verifying}
            id={`verify-btn-${reg.id}`}
          >
            {verifying ? 'Verifying…' : '✓ Mark Verified'}
          </button>
        )}
        {reg.status === 'verified' && (
          <p className="reg-confirmation-note" style={{ marginTop: 20 }}>
            ✅ Verified on {reg.verified_at ? new Date(reg.verified_at).toLocaleDateString() : '—'}
          </p>
        )}
      </aside>
    </div>
  )
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [user, setUser]               = useState(undefined)  // undefined = loading
  const [authError, setAuthError]     = useState('')
  const [regs, setRegs]               = useState([])
  const [loading, setLoading]         = useState(false)
  const [filterEvent, setFilterEvent] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected]       = useState(null)
  const [verifying, setVerifying]     = useState(false)

  // ── Auth listener (Supabase) ──────────────────────────────────
  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      if (u && ADMIN_EMAILS.has(u.email)) {
        setUser(u)
      } else {
        setUser(null)
        if (u) supabase.auth.signOut()
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      if (u && ADMIN_EMAILS.has(u.email)) {
        setUser(u)
      } else {
        setUser(null)
        if (u) supabase.auth.signOut()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load registrations when logged in
  useEffect(() => {
    if (!user) return
    setLoading(true)
    listRegistrations(filterEvent || null)
      .then(setRegs)
      .catch(() => setRegs([]))
      .finally(() => setLoading(false))
  }, [user, filterEvent])

  const handleLogin = async (email, password) => {
    setAuthError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError('Invalid email or password.')
  }

  const handleVerify = useCallback(async (id) => {
    setVerifying(true)
    try {
      await markVerified(id)
      setRegs((prev) => prev.map((r) => r.id === id ? { ...r, status: 'verified', verified_at: new Date().toISOString() } : r))
      setSelected((s) => s?.id === id ? { ...s, status: 'verified' } : s)
    } catch {
      alert('Failed to mark verified. Check your connection.')
    } finally {
      setVerifying(false)
    }
  }, [])

  if (user === undefined) return <div className="admin-loading">Loading…</div>
  if (!user) return <LoginForm onLogin={handleLogin} error={authError} />

  const filtered = regs.filter((r) => !filterStatus || r.status === filterStatus)

  return (
    <div className="admin-wrap">
      <div className="admin-topbar">
        <h1 className="admin-heading">Registrations</h1>
        <div className="admin-topbar-right">
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user.email}</span>
          <button className="btn btn-ghost" onClick={() => supabase.auth.signOut()} style={{ padding: '8px 16px' }}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="admin-filters">
        <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} className="admin-filter-select" aria-label="Filter by event">
          <option value="">All Events</option>
          {efestEvents.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="admin-filter-select" aria-label="Filter by status">
          <option value="">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="verified">Verified</option>
        </select>
        <span className="admin-count">{filtered.length} registration{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', padding: '40px 0' }}>Loading registrations…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', padding: '40px 0' }}>No registrations found.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Team ID</th><th>Team Name</th><th>Event</th>
                <th>Leader</th><th>Status</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="admin-table-row"
                  onClick={() => setSelected(r)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelected(r)}
                  aria-label={`View details for ${r.team_data?.teamName}`}
                >
                  <td><code>{r.team_id}</code></td>
                  <td>{r.team_data?.teamName ?? '—'}</td>
                  <td>{r.event_id}</td>
                  <td>{r.team_data?.leaderName ?? '—'}</td>
                  <td><span className={`status-badge status-${r.status}`}>{r.status}</span></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DetailDrawer
        reg={selected}
        onClose={() => setSelected(null)}
        onVerify={handleVerify}
        verifying={verifying}
      />
    </div>
  )
}
