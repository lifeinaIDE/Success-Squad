/**
 * AdminDashboard.jsx — Protected admin route.
 *
 * Features:
 *  - Login form (Supabase Auth)
 *  - Review Queue: pending_payments with status='submitted'
 *  - Action: Verify (creates registration) or Reject (releases slot)
 *  - Registrations: view of all verified/confirmed registrations
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase.js'
import { listSubmittedPayments, listRegistrations, verifyPayment, rejectPayment } from '../services/registrations.js'
import { efestEvents } from '../data/eventConfigs.js'

const ADMIN_EMAILS = new Set([
  'admin@successsquad.in',
  // add yours here
])

function LoginForm({ onLogin, error }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

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
        <p className="admin-login-sub">Manual Review Dashboard</p>
        {error && <p className="reg-error" role="alert">{error}</p>}
        <div className="form-group">
          <label htmlFor="admin-email">Email</label>
          <input id="admin-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="admin-pass">Password</label>
          <input id="admin-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}

function ReviewDrawer({ row, onClose, onAction, processing }) {
  const [reason, setReason] = useState('')

  if (!row) return null
  const members = row.team_data?.members ?? []

  return (
    <div className="admin-drawer-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="admin-drawer" role="dialog" aria-label="Review detail">
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h3 className="admin-drawer-title">{row.team_data?.teamName ?? '—'}</h3>
        <p className="admin-drawer-meta">Order ID: <strong>{row.order_id}</strong></p>
        <p className="admin-drawer-meta">Event: <strong>{row.event_id}</strong></p>
        <p className="admin-drawer-meta">Amount: <strong>₹{row.amount_inr}</strong></p>
        
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: 12, borderRadius: 8, marginTop: 16 }}>
          <p className="admin-drawer-meta" style={{ color: '#fca5a5', margin: 0 }}>
            UTR / Reference:<br/><strong style={{ fontSize: '1.2rem', color: '#fff', letterSpacing: 1 }}>{row.utr}</strong>
          </p>
          {row.isDuplicateUtr && (
            <p style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold', marginTop: 8 }}>
              ⚠️ WARNING: This UTR has been submitted multiple times!
            </p>
          )}
        </div>

        <h4 style={{ marginTop: 20, marginBottom: 8 }}>Payment Screenshot</h4>
        {row.screenshot_url
          ? <a href={row.screenshot_url} target="_blank" rel="noopener noreferrer">
              <img src={row.screenshot_url} alt="Payment proof" className="admin-screenshot" />
            </a>
          : <p className="admin-drawer-meta" style={{ color: 'var(--text-muted)' }}>No screenshot uploaded.</p>
        }

        <h4 style={{ marginTop: 20, marginBottom: 8 }}>Leader Details</h4>
        <p className="admin-drawer-meta">
          {row.team_data?.leaderName} · {row.team_data?.leaderPhone} · {row.team_data?.leaderEmail}
        </p>

        {row.status === 'submitted' && (
          <div style={{ marginTop: 24 }}>
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: 16, background: '#10b981' }}
              onClick={() => onAction(row.id, 'verify')}
              disabled={processing}
            >
              ✅ Mark Verified (Confirm Slot)
            </button>
            
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <input 
                type="text" 
                placeholder="Reason for rejection (e.g. UTR mismatch)" 
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="form-input"
                style={{ marginBottom: 8 }}
              />
              <button
                className="btn btn-ghost"
                style={{ width: '100%', color: '#ef4444' }}
                onClick={() => {
                  if (!reason) return alert('Provide a rejection reason.')
                  onAction(row.id, 'reject', reason)
                }}
                disabled={processing}
              >
                ❌ Reject (Release Slot)
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

export default function AdminDashboard() {
  const [user, setUser] = useState(undefined)
  const [authError, setAuthError] = useState('')
  const [queue, setQueue] = useState([])
  const [regs, setRegs] = useState([])
  const [duplicates, setDuplicates] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [filterEvent, setFilterEvent] = useState('')
  const [tab, setTab] = useState('queue') // 'queue' | 'verified'
  const [selected, setSelected] = useState(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      if (u && ADMIN_EMAILS.has(u.email)) setUser(u)
      else { setUser(null); if (u) supabase.auth.signOut() }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      if (u && ADMIN_EMAILS.has(u.email)) setUser(u)
      else { setUser(null); if (u) supabase.auth.signOut() }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      if (tab === 'queue') {
        const data = await listSubmittedPayments(filterEvent || null)
        
        // Fetch duplicate UTRs to highlight them
        const { data: dupData } = await supabase.from('duplicate_utrs').select('utr')
        const dupSet = new Set((dupData || []).map(d => d.utr))
        setDuplicates(dupSet)

        // Mark duplicates in the queue array
        const enhancedQueue = data.map(item => ({
          ...item,
          isDuplicateUtr: dupSet.has(item.utr)
        }))
        setQueue(enhancedQueue)
      } else {
        const data = await listRegistrations(filterEvent || null)
        setRegs(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user, filterEvent, tab])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleLogin = async (email, password) => {
    setAuthError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError('Invalid email or password.')
  }

  const handleAction = async (id, actionType, reason = '') => {
    if (!confirm(`Are you sure you want to ${actionType} this payment?`)) return
    setProcessing(true)
    try {
      if (actionType === 'verify') {
        await verifyPayment(id)
      } else {
        await rejectPayment(id, reason)
      }
      setSelected(null)
      loadData() // Refresh list
    } catch (e) {
      alert(`Failed to ${actionType}: ` + e.message)
    } finally {
      setProcessing(false)
    }
  }

  if (user === undefined) return <div className="admin-loading">Loading…</div>
  if (!user) return <LoginForm onLogin={handleLogin} error={authError} />

  return (
    <div className="admin-wrap">
      <div className="admin-topbar">
        <h1 className="admin-heading">E-Fest Admin</h1>
        <div className="admin-topbar-right">
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user.email}</span>
          <button className="btn btn-ghost" onClick={() => supabase.auth.signOut()} style={{ padding: '8px 16px' }}>Sign Out</button>
        </div>
      </div>

      <div className="admin-filters">
        <div style={{ display: 'flex', gap: 12 }}>
          <button className={`btn ${tab === 'queue' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('queue')}>
            Review Queue ({tab === 'queue' ? queue.length : '?'})
          </button>
          <button className={`btn ${tab === 'verified' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('verified')}>
            Verified Registrations
          </button>
        </div>
        <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} className="admin-filter-select">
          <option value="">All Events</option>
          {efestEvents.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', padding: '40px 0' }}>Loading…</p>
      ) : tab === 'queue' ? (
        queue.length === 0 ? <p style={{ color: 'var(--text-muted)', padding: '40px 0' }}>All clear! No pending submissions.</p> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event</th><th>Team Name</th><th>UTR</th><th>Amount</th><th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((r) => (
                  <tr key={r.id} className="admin-table-row" onClick={() => setSelected(r)}>
                    <td>{r.event_id}</td>
                    <td>{r.team_data?.teamName ?? '—'}</td>
                    <td style={{ color: r.isDuplicateUtr ? '#ef4444' : 'inherit', fontWeight: r.isDuplicateUtr ? 'bold' : 'normal' }}>
                      {r.utr} {r.isDuplicateUtr && '⚠️'}
                    </td>
                    <td>₹{r.amount_inr}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        regs.length === 0 ? <p style={{ color: 'var(--text-muted)', padding: '40px 0' }}>No verified registrations found.</p> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Team ID</th><th>Event</th><th>Team Name</th><th>Verified</th>
                </tr>
              </thead>
              <tbody>
                {regs.map((r) => (
                  <tr key={r.id} className="admin-table-row">
                    <td><code>{r.team_id}</code></td>
                    <td>{r.event_id}</td>
                    <td>{r.team_data?.teamName ?? '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(r.verified_at || r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'queue' && (
        <ReviewDrawer
          row={selected}
          onClose={() => setSelected(null)}
          onAction={handleAction}
          processing={processing}
        />
      )}
    </div>
  )
}
