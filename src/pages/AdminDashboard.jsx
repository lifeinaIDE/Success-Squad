/**
 * AdminDashboard.jsx - Protected admin route.
 *
 * Features:
 *  - Login form (Supabase Auth)
 *  - Review Queue: pending_payments with status='submitted' OR 'pending_unstop_review'
 *    CraftCode (Unstop) items appear distinctly tagged in the queue.
 *  - Action: Verify (creates registration) or Reject (releases slot)
 *  - Registrations: view of all verified/confirmed registrations
 *  - Member slots with null data display as '-'
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase.js'
import { listRegistrations, verifyPayment, rejectPayment } from '../services/registrations.js'
import { efestEvents } from '../data/eventConfigs.js'
import { generateReceipt } from '../utils/generateReceipt.js'

// Fetch queue items: both standard 'submitted' and CraftCode 'pending_unstop_review'
async function listReviewQueue(eventId = null) {
  if (!supabase) return []
  let query = supabase
    .from('pending_payments')
    .select('*')
    .in('status', ['submitted', 'pending_unstop_review'])
    .order('created_at', { ascending: true })
  if (eventId) query = query.eq('event_id', eventId)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

// Helper to format a member slot (may be null for optional unfilled members)
function memberDisplay(m) {
  if (!m) return '-'
  const parts = [m.name, m.email].filter(Boolean)
  return parts.length ? parts.join(' · ') : '-'
}

const ADMIN_EMAILS = new Set([
  'admin@successsquad.in',
  'Success_Squad@admin.com'
])

function LoginForm({ onLogin, error }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    // Map the custom username to the required Supabase email format
    let loginEmail = username.trim()
    if (loginEmail === 'Success_Squad') {
      loginEmail = 'Success_Squad@admin.com'
    }
    await onLogin(loginEmail, password)
    setLoading(false)
  }

  return (
    <div className="admin-login-wrap">
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <h1 className="admin-login-title">Admin Login</h1>
        <p className="admin-login-sub">Manual Review Dashboard</p>
        {error && <p className="reg-error" role="alert">{error}</p>}
        <div className="form-group">
          <label htmlFor="admin-email">Username or Email</label>
          <input 
            id="admin-email" 
            type="text" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            placeholder="e.g. Success_Squad"
            required 
          />
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
  const isUnstop = row.status === 'pending_unstop_review'

  return (
    <div className="admin-drawer-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="admin-drawer" role="dialog" aria-label="Review detail">
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h3 className="admin-drawer-title">{row.team_data?.teamName ?? '-'}</h3>
        {isUnstop && (
          <div style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 6, padding: '6px 10px', marginBottom: 10, fontSize: '0.8rem', color: '#a5b4fc', fontWeight: 600 }}>
            🎮 CraftCode, Unstop Verification
          </div>
        )}
        <p className="admin-drawer-meta">Order ID: <strong>{row.order_id}</strong></p>
        <p className="admin-drawer-meta">Event: <strong>{row.event_id}</strong></p>
        <p className="admin-drawer-meta">Amount: <strong>₹{row.amount_inr}</strong></p>
        
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: 12, borderRadius: 8, marginTop: 16 }}>
          <p className="admin-drawer-meta" style={{ color: '#fca5a5', margin: 0 }}>
            {isUnstop ? 'Unstop Registration ID' : 'Transaction ID'}:<br/>
            <strong style={{ fontSize: '1.2rem', color: '#fff', letterSpacing: 1 }}>{row.utr}</strong>
          </p>
          {row.isDuplicateUtr && !isUnstop && (
            <p style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold', marginTop: 8 }}>
              ⚠️ WARNING: This Transaction ID has been submitted multiple times!
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
          {row.team_data?.leaderName ?? '-'} · {row.team_data?.leaderPhone ?? '-'} · {row.team_data?.leaderEmail ?? '-'}
        </p>

        {members.length > 0 && (
          <>
            <h4 style={{ marginTop: 16, marginBottom: 8 }}>Team Members</h4>
            {members.map((m, i) => (
              <p key={i} className="admin-drawer-meta" style={{ fontSize: '0.82rem' }}>
                Member {i + 2}: {memberDisplay(m)}
              </p>
            ))}
          </>
        )}

        {(row.status === 'submitted' || row.status === 'pending_unstop_review') && (
          <div style={{ marginTop: 24 }}>
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: 16, background: '#10b981' }}
              onClick={() => onAction(row.id, 'verify')}
              disabled={processing}
            >
              {isUnstop ? '✅ Confirm Unstop Registration' : '✅ Mark Verified (Confirm Slot)'}
            </button>
            
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <input 
                type="text" 
                placeholder={isUnstop ? 'Reason for rejection (e.g. Unstop ID not found)' : 'Reason for rejection (e.g. Transaction ID mismatch)'}
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
    if (!supabase) {
      setUser(null)
      setAuthError('Supabase is not configured. Please verify that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Vercel environment variables.')
      return
    }

    supabase.auth.getSession().then(({ data: { session } = {} }) => {
      const u = session?.user ?? null
      if (u && ADMIN_EMAILS.has(u.email)) setUser(u)
      else { setUser(null); if (u) supabase.auth.signOut() }
    }).catch((err) => {
      console.warn('[Admin] getSession error:', err)
      setUser(null)
      setAuthError('Session check failed: ' + (err.message || 'Unknown error'))
    })

    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      if (u && ADMIN_EMAILS.has(u.email)) setUser(u)
      else { setUser(null); if (u) supabase.auth.signOut() }
    })
    return () => subscription?.unsubscribe?.()
  }, [])

  const loadData = useCallback(async () => {
    if (!user || !supabase) return
    setLoading(true)
    try {
      if (tab === 'queue') {
        const data = await listReviewQueue(filterEvent || null)
        
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
    if (!supabase) {
      setAuthError('Sign-in unavailable: Supabase environment variables are not configured in Vercel.')
      return
    }
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
                  <th>Event</th><th>Team Name</th><th>Type</th><th>Transaction / Unstop ID</th><th>Amount</th><th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((r) => {
                  const isUnstop = r.status === 'pending_unstop_review'
                  return (
                    <tr key={r.id} className="admin-table-row" onClick={() => setSelected(r)}>
                      <td>{r.event_id}</td>
                      <td>{r.team_data?.teamName ?? '-'}</td>
                      <td>
                        {isUnstop
                          ? <span style={{ fontSize: '0.75rem', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Unstop</span>
                          : <span style={{ fontSize: '0.75rem', background: 'rgba(16,185,129,0.12)', color: '#6ee7b7', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>UPI</span>}
                      </td>
                      <td style={{ color: r.isDuplicateUtr && !isUnstop ? '#ef4444' : 'inherit', fontWeight: r.isDuplicateUtr && !isUnstop ? 'bold' : 'normal' }}>
                        {r.utr ?? '-'} {r.isDuplicateUtr && !isUnstop && '⚠️'}
                      </td>
                      <td>₹{r.amount_inr}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        regs.length === 0 ? <p style={{ color: 'var(--text-muted)', padding: '40px 0' }}>No verified registrations found.</p> : (
          <div className="admin-table-wrap">
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-primary"
                onClick={async () => {
                  setProcessing(true)
                  try {
                    const JSZip = (await import('jszip')).default
                    const { saveAs } = (await import('file-saver')).default
                    const zip = new JSZip()
                    
                    const { data: { session } } = await supabase.auth.getSession()
                    
                    for (const r of regs) {
                      if (!r.receipt_path) continue
                      const res = await supabase.functions.invoke('get-receipt-url', {
                        body: { team_id: r.team_id, verification_val: 'admin' },
                        headers: { Authorization: `Bearer ${session?.access_token}` }
                      })
                      if (res.data?.url) {
                        const fileRes = await fetch(res.data.url)
                        const blob = await fileRes.blob()
                        zip.file(`SuccessSquad-Receipt-${r.team_id}.pdf`, blob)
                      }
                    }
                    
                    const content = await zip.generateAsync({ type: 'blob' })
                    saveAs(content, `Receipts_${filterEvent || 'All'}.zip`)
                  } catch (e) {
                    alert('Failed to download ZIP: ' + e.message)
                  } finally {
                    setProcessing(false)
                  }
                }}
                disabled={processing}
              >
                {processing ? 'Generating ZIP...' : 'Download All Receipts (ZIP)'}
              </button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Team ID</th><th>Event</th><th>Team Name</th><th>Verified</th><th>Receipt DL'd</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {regs.map((r) => (
                  <tr key={r.id} className="admin-table-row">
                    <td><code>{r.team_id}</code></td>
                    <td>{r.event_id}</td>
                    <td>{r.team_data?.teamName ?? '-'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(r.verified_at || r.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {r.receipt_downloaded_at 
                        ? <span style={{ color: '#10B981' }}>Yes ({new Date(r.receipt_downloaded_at).toLocaleDateString()})</span>
                        : <span style={{ color: '#EF4444' }}>No</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button 
                          className="btn btn-primary"
                          style={{ fontSize: '0.75rem', padding: '4px 10px', background: '#10b981', border: 'none' }}
                          title="Download Receipt (PDF)"
                          onClick={async (e) => {
                            e.stopPropagation()
                            try {
                              await generateReceipt(r)
                            } catch (err) {
                              alert('Failed to generate receipt: ' + err.message)
                            }
                          }}
                        >
                          ⬇ Receipt
                        </button>
                        <button 
                          className="btn btn-ghost"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (!confirm(`Regenerate receipt for ${r.team_id}?`)) return
                            try {
                              const res = await supabase.functions.invoke('generate-receipt', {
                                body: { registration_id: r.id, force: true }
                              })
                              if (res.error) throw new Error(res.error.message || 'Unknown error')
                              alert('Receipt regenerated successfully')
                              loadData()
                            } catch (err) {
                              alert('Failed to regenerate: ' + err.message)
                            }
                          }}
                        >
                          Regenerate
                        </button>
                      </div>
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
