/**
 * AdminDashboard.jsx — Comprehensive Admin Portal for Success Squad
 *
 * Secure Supabase Authentication & Multi-Module Content Management:
 *  1. Events (Upcoming & Past)
 *  2. Team Members (Leadership, Domain Leads, Core)
 *  3. Startups (Incubated & Featured Portfolio)
 *  4. Gallery (Event Albums & Squad Memories)
 *  5. Registrations (Live E-Fest verification queue, metrics & Excel export)
 *  6. Contact Messages (Inquiries from Get Involved)
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../services/supabase.js'
import { listRegistrations, verifyPayment, rejectPayment } from '../services/registrations.js'
import { efestEvents } from '../data/eventConfigs.js'
import { exportRegistrationsToExcel } from '../utils/exportToExcel.js'
import { generateReceipt, printReceipt } from '../utils/generateReceipt.js'
import {
  fetchEvents, saveEvent, deleteEvent,
  fetchTeamMembers, saveTeamMember, deleteTeamMember,
  fetchStartups, saveStartup, deleteStartup,
  fetchGalleryItems, saveGalleryItem, deleteGalleryItem,
  fetchContactMessages, updateMessageStatus, deleteContactMessage
} from '../services/adminService.js'

// Environment-configured admin emails
const envAdmins = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

const ADMIN_EMAILS = new Set([
  'admin@successsquad.in',
  'admin@success-squad.in',
  'jspmecell@gmail.com',
  ...envAdmins
])

// ─────────────────────────────────────────────────────────────────────────────
// 1. LOGIN FORM COMPONENT (Username / Email & Password)
// ─────────────────────────────────────────────────────────────────────────────

function LoginForm({ onLogin, onDemoLogin, error, isSupabaseActive }) {
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onLogin(usernameOrEmail.trim(), password)
    setLoading(false)
  }

  return (
    <div className="admin-login-wrap">
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 12px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.2))',
            border: '1px solid rgba(99,102,241,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem'
          }}>
            🛡️
          </div>
          <h1 className="admin-login-title" style={{ marginTop: '4px' }}>Admin Portal</h1>
          <p className="admin-login-sub">Success Squad Control Center</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            lineHeight: 1.4
          }}>
            ⚠️ {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="admin-username">Username or Email</label>
          <input
            id="admin-username"
            type="text"
            placeholder="admin or admin@successsquad.in"
            value={usernameOrEmail}
            onChange={e => setUsernameOrEmail(e.target.value)}
            required
            className="form-input"
            autoComplete="username"
          />
        </div>

        <div className="form-group">
          <label htmlFor="admin-pass">Password</label>
          <input
            id="admin-pass"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="form-input"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '6px', justifyContent: 'center' }}
          disabled={loading}
        >
          {loading ? 'Authenticating with Supabase…' : 'Sign In as Admin →'}
        </button>

        {!isSupabaseActive && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '0.78rem',
            color: '#fbbf24',
            textAlign: 'center'
          }}>
            ℹ️ Supabase environment variables not detected in client. You can use <strong>Demo Preview</strong> to explore all dashboard features.
          </div>
        )}

        {/* Demo Mode for testing when local .env is not yet configured */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px', textAlign: 'center' }}>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ fontSize: '0.82rem', width: '100%', color: 'var(--accent)', justifyContent: 'center' }}
            onClick={onDemoLogin}
          >
            ⚡ Preview Admin Dashboard (Demo Access)
          </button>
        </div>
      </form>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. REGISTRATIONS REVIEW DRAWER
// ─────────────────────────────────────────────────────────────────────────────

function ReviewDrawer({ row, onClose, onAction, processing }) {
  const [reason, setReason] = useState('')

  if (!row) return null
  const members = row.team_data?.members ?? []
  const isUnstop = row.status === 'pending_unstop_review'
  const isPending = row.status === 'submitted' || row.status === 'pending_unstop_review'

  return (
    <div className="admin-drawer-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="admin-drawer" role="dialog" aria-label="Registration detail">
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h3 className="admin-drawer-title">{row.team_data?.teamName ?? '—'}</h3>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <span className={`status-badge status-${row.status === 'verified' || row.status === 'confirmed' ? 'verified' : 'pending'}`}>
            {row.status?.toUpperCase() || 'PENDING'}
          </span>
          {isUnstop && (
            <span style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
              CraftCode Unstop
            </span>
          )}
        </div>

        <p className="admin-drawer-meta">Order ID: <strong>{row.order_id || '—'}</strong></p>
        {row.team_id && <p className="admin-drawer-meta">Team ID: <strong style={{ color: 'var(--accent)' }}>{row.team_id}</strong></p>}
        <p className="admin-drawer-meta">Event: <strong>{row.event_id}</strong></p>
        <p className="admin-drawer-meta">Amount: <strong>₹{row.amount_inr ?? 0}</strong></p>

        <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)', padding: '12px 16px', borderRadius: 8, marginTop: 16 }}>
          <p className="admin-drawer-meta" style={{ color: '#a5b4fc', margin: 0 }}>
            {isUnstop ? 'Unstop Registration ID' : 'Transaction ID (UTR)'}:<br/>
            <strong style={{ fontSize: '1.2rem', color: '#fff', letterSpacing: 1 }}>{row.utr || '—'}</strong>
          </p>
          {row.isDuplicateUtr && !isUnstop && (
            <p style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold', marginTop: 8 }}>
              ⚠️ WARNING: This Transaction ID has been submitted multiple times!
            </p>
          )}
        </div>

        <h4 style={{ marginTop: 20, marginBottom: 8 }}>Payment Screenshot</h4>
        {row.screenshot_url ? (
          <a href={row.screenshot_url} target="_blank" rel="noopener noreferrer">
            <img src={row.screenshot_url} alt="Payment proof" className="admin-screenshot" style={{ maxHeight: '220px', objectFit: 'contain' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'block', marginTop: 4 }}>Open full image in new tab ↗</span>
          </a>
        ) : (
          <p className="admin-drawer-meta" style={{ color: 'var(--text-muted)' }}>No screenshot uploaded.</p>
        )}

        <h4 style={{ marginTop: 20, marginBottom: 8 }}>Leader Details</h4>
        <p className="admin-drawer-meta">
          <strong>Name:</strong> {row.team_data?.leaderName ?? '—'}<br/>
          <strong>Phone / WhatsApp:</strong> {row.team_data?.leaderPhone ?? '—'}<br/>
          <strong>Email:</strong> {row.team_data?.leaderEmail ?? '—'}
        </p>

        {members.length > 0 && (
          <>
            <h4 style={{ marginTop: 16, marginBottom: 8 }}>Team Members ({members.length})</h4>
            {members.map((m, i) => (
              <p key={i} className="admin-drawer-meta" style={{ fontSize: '0.82rem', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                Member {i + 2}: <strong>{[m.name, m.email].filter(Boolean).join(' · ') || '—'}</strong>
              </p>
            ))}
          </>
        )}

        {isPending && (
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
                placeholder={isUnstop ? 'Reason for rejection (e.g. Invalid Unstop ID)' : 'Reason for rejection (e.g. UTR mismatch)'}
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="form-input"
                style={{ marginBottom: 8 }}
              />
              <button
                className="btn btn-ghost"
                style={{ width: '100%', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
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

        {(row.status === 'verified' || row.status === 'confirmed' || row.payment_status === 'PAID') && (
          <div style={{ marginTop: 24, padding: '16px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 10, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#10b981' }}>Official Payment Receipt</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '8px 12px', fontSize: '0.85rem', background: '#10b981', justifyContent: 'center' }}
                onClick={async () => {
                  try {
                    await generateReceipt(row)
                  } catch (e) {
                    alert('Receipt error: ' + e.message)
                  }
                }}
              >
                ⬇ Download PDF
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '8px 12px', fontSize: '0.85rem', justifyContent: 'center' }}
                onClick={async () => {
                  try {
                    await printReceipt(row)
                  } catch (e) {
                    alert('Print error: ' + e.message)
                  }
                }}
              >
                🖨️ Print Receipt
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. MAIN ADMIN DASHBOARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [user, setUser] = useState(undefined)
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState('events') // 'events' | 'team' | 'startups' | 'gallery' | 'registrations' | 'messages'
  const [feedback, setFeedback] = useState('')

  // Multi-module Data States
  const [eventsList, setEventsList] = useState([])
  const [teamList, setTeamList] = useState([])
  const [startupsList, setStartupsList] = useState([])
  const [galleryList, setGalleryList] = useState([])
  const [messagesList, setMessagesList] = useState([])

  // Registration specifics
  const [allPayments, setAllPayments] = useState([])
  const [queue, setQueue] = useState([])
  const [regs, setRegs] = useState([])
  const [filterEvent, setFilterEvent] = useState('')
  const [regSearchTerm, setRegSearchTerm] = useState('')
  const [regSubTab, setRegSubTab] = useState('all') // 'all' | 'queue' | 'verified'
  const [selectedReg, setSelectedReg] = useState(null)
  const [processingReg, setProcessingReg] = useState(false)

  // Modals / Item Editing state
  const [modalType, setModalType] = useState(null) // 'event' | 'team' | 'startup' | 'gallery' | 'message_detail'
  const [editingItem, setEditingItem] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const isSupabaseActive = Boolean(supabase)

  const showNotification = (msg) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(''), 4000)
  }

  // ── Authentication Check ──────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) {
      setUser(null)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      if (u && (ADMIN_EMAILS.has(u.email?.toLowerCase()) || ADMIN_EMAILS.size === 0)) {
        setUser(u)
      } else {
        setUser(null)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      if (u && (ADMIN_EMAILS.has(u.email?.toLowerCase()) || ADMIN_EMAILS.size === 0)) {
        setUser(u)
      } else {
        setUser(null)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  // ── Data Loader ───────────────────────────────────────────────────────────
  const loadAllData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [events, team, startups, gallery, messages] = await Promise.all([
        fetchEvents(),
        fetchTeamMembers(),
        fetchStartups(),
        fetchGalleryItems(),
        fetchContactMessages()
      ])

      setEventsList(events || [])
      setTeamList(team || [])
      setStartupsList(startups || [])
      setGalleryList(gallery || [])
      setMessagesList(messages || [])

      // Registrations & Payments
      if (supabase) {
        try {
          const { data: qData } = await supabase
            .from('pending_payments')
            .select('*')
            .in('status', ['submitted', 'pending_unstop_review'])
            .order('created_at', { ascending: false })
          setQueue(qData || [])

          const regData = await listRegistrations(filterEvent || null)
          setRegs(regData || [])

          const { data: pData } = await supabase
            .from('pending_payments')
            .select('*')
            .order('created_at', { ascending: false })
          setAllPayments(pData || [])
        } catch (e) {
          console.warn('[Admin] Registrations query warning:', e)
        }
      }
    } catch (e) {
      console.error('Error loading dashboard data:', e)
    } finally {
      setLoading(false)
    }
  }, [user, filterEvent])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // ── Authentication Handlers ───────────────────────────────────────────────
  const handleLogin = async (usernameOrEmail, password) => {
    setAuthError('')
    if (!supabase) {
      setAuthError('Supabase is not configured with environment variables. Please click Preview Admin Dashboard.')
      return
    }

    // Allow entering username e.g. "admin" or full email
    let loginEmail = usernameOrEmail
    if (!loginEmail.includes('@')) {
      loginEmail = `${loginEmail}@successsquad.in`
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password
    })

    if (error) {
      setAuthError(error.message || 'Invalid username/email or password.')
    } else if (data?.user && !ADMIN_EMAILS.has(data.user.email?.toLowerCase()) && ADMIN_EMAILS.size > 0) {
      setAuthError('Access restricted: This user is not authorized as an Admin.')
      supabase.auth.signOut()
    } else {
      setUser(data.user)
    }
  }

  const handleDemoLogin = () => {
    setUser({ email: 'admin@successsquad.in', role: 'admin_demo' })
  }

  const handleSignOut = () => {
    if (supabase) supabase.auth.signOut()
    setUser(null)
  }

  // ── Registration Actions ──────────────────────────────────────────────────
  const handleRegAction = async (id, actionType, reason = '') => {
    if (!confirm(`Are you sure you want to ${actionType} this registration?`)) return
    setProcessingReg(true)
    try {
      if (actionType === 'verify') {
        await verifyPayment(id)
        showNotification('Registration marked as Verified!')
      } else {
        await rejectPayment(id, reason)
        showNotification('Registration rejected and slot released.')
      }
      setSelectedReg(null)
      loadAllData()
    } catch (e) {
      alert(`Failed to ${actionType}: ` + e.message)
    } finally {
      setProcessingReg(false)
    }
  }

  // Registration Master List & Metrics
  const masterList = useMemo(() => {
    const map = new Map()
    allPayments.forEach(p => { map.set(p.order_id || p.id, { ...p, source: 'payment' }) })
    regs.forEach(r => {
      const key = r.order_id || r.team_id || r.id
      if (map.has(key)) {
        map.set(key, { ...map.get(key), ...r, status: 'verified', source: 'registration' })
      } else {
        map.set(key, { ...r, status: 'verified', source: 'registration' })
      }
    })
    return Array.from(map.values())
  }, [allPayments, regs])

  const metrics = useMemo(() => {
    const totalEntries = masterList.length
    const verifiedCount = masterList.filter(r => r.status === 'verified' || r.status === 'confirmed').length
    const pendingCount = masterList.filter(r => r.status === 'submitted' || r.status === 'pending_unstop_review').length
    const totalRevenue = masterList
      .filter(r => r.status === 'verified' || r.status === 'confirmed' || r.status === 'submitted')
      .reduce((sum, r) => sum + (Number(r.amount_inr) || 0), 0)

    const perEvent = {}
    efestEvents.forEach(e => { perEvent[e.id] = 0 })
    masterList.forEach(r => {
      if (r.event_id && perEvent[r.event_id] !== undefined) {
        perEvent[r.event_id]++
      }
    })
    return { totalEntries, verifiedCount, pendingCount, totalRevenue, perEvent }
  }, [masterList])

  const activeRegistrations = useMemo(() => {
    let list = regSubTab === 'queue' ? queue : (regSubTab === 'verified' ? regs : masterList)
    if (regSearchTerm.trim()) {
      const q = regSearchTerm.toLowerCase().trim()
      list = list.filter(item => {
        const teamName = item.team_data?.teamName?.toLowerCase() || ''
        const leaderName = item.team_data?.leaderName?.toLowerCase() || ''
        const leaderPhone = item.team_data?.leaderPhone?.toLowerCase() || ''
        const utr = item.utr?.toLowerCase() || ''
        const orderId = item.order_id?.toLowerCase() || ''
        const teamId = item.team_id?.toLowerCase() || ''
        return teamName.includes(q) || leaderName.includes(q) || leaderPhone.includes(q) || utr.includes(q) || orderId.includes(q) || teamId.includes(q)
      })
    }
    return list
  }, [regSubTab, queue, regs, masterList, regSearchTerm])

  const handleExportExcel = () => {
    try {
      const rowsToExport = activeRegistrations.length > 0 ? activeRegistrations : masterList
      if (rowsToExport.length === 0) {
        alert('No registrations available to export.')
        return
      }
      exportRegistrationsToExcel(rowsToExport, `EFest26_Registrations_${Date.now()}`)
      showNotification(`Excel sheet exported (${rowsToExport.length} entries)!`)
    } catch (err) {
      alert('Failed to export Excel: ' + err.message)
    }
  }

  // ── Item Action Handlers ──────────────────────────────────────────────────
  const handleSaveItem = async (e) => {
    e.preventDefault()
    try {
      if (modalType === 'event') {
        await saveEvent(editingItem)
        showNotification('Event saved successfully!')
      } else if (modalType === 'team') {
        await saveTeamMember(editingItem)
        showNotification('Team member saved successfully!')
      } else if (modalType === 'startup') {
        await saveStartup(editingItem)
        showNotification('Startup saved successfully!')
      } else if (modalType === 'gallery') {
        await saveGalleryItem(editingItem)
        showNotification('Gallery item saved successfully!')
      }
      setModalType(null)
      setEditingItem(null)
      loadAllData()
    } catch (err) {
      alert('Failed to save item: ' + err.message)
    }
  }

  const handleDeleteItem = async (type, id, title) => {
    if (!confirm(`Are you sure you want to delete "${title || id}"?`)) return
    try {
      if (type === 'event') await deleteEvent(id)
      else if (type === 'team') await deleteTeamMember(id)
      else if (type === 'startup') await deleteStartup(id)
      else if (type === 'gallery') await deleteGalleryItem(id)
      else if (type === 'message') await deleteContactMessage(id)
      showNotification('Item deleted.')
      loadAllData()
    } catch (err) {
      alert('Failed to delete item: ' + err.message)
    }
  }

  const handleUpdateMessageStatus = async (id, status) => {
    await updateMessageStatus(id, status)
    showNotification(`Message marked as ${status}.`)
    loadAllData()
  }

  // Unread messages count
  const unreadMessagesCount = useMemo(() => {
    return messagesList.filter(m => m.status === 'unread').length
  }, [messagesList])

  // If loading session
  if (user === undefined) return <div className="admin-loading">Checking Admin Session…</div>

  // If unauthenticated
  if (!user) {
    return (
      <LoginForm
        onLogin={handleLogin}
        onDemoLogin={handleDemoLogin}
        error={authError}
        isSupabaseActive={isSupabaseActive}
      />
    )
  }

  return (
    <div className="admin-wrap">
      {/* ── TOP COMMAND HEADER ────────────────────────────────────────────── */}
      <div className="admin-topbar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="admin-heading">Success Squad Command Center</h1>
            <span style={{
              background: isSupabaseActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: isSupabaseActive ? '#34d399' : '#fbbf24',
              border: `1px solid ${isSupabaseActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.5px'
            }}>
              {isSupabaseActive ? '● SUPABASE CONNECTED' : '○ PREVIEW MODE'}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0' }}>
            Manage Events, Team Members, Startups, Gallery, Registrations & Contact Messages.
          </p>
        </div>

        <div className="admin-topbar-right">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '6px 14px',
            borderRadius: '50px',
            border: '1px solid var(--border)'
          }}>
            <span style={{ fontSize: '0.9rem' }}>👤</span>
            <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600 }}>{user.email}</span>
          </div>

          <button
            className="btn btn-ghost"
            onClick={loadAllData}
            title="Refresh Database Content"
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          >
            🔄 Refresh
          </button>

          <button
            className="btn btn-ghost"
            onClick={handleSignOut}
            style={{ padding: '8px 16px', fontSize: '0.85rem', color: '#f87171' }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Floating feedback alert */}
      {feedback && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          color: '#6ee7b7',
          padding: '12px 20px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>✅</span> {feedback}
        </div>
      )}

      {/* ── ADMIN NAVIGATION TABS ─────────────────────────────────────────── */}
      <div className="admin-tabs-bar" role="tablist">
        <button
          className={`admin-tab-btn ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => { setActiveTab('events'); setSearchTerm('') }}
        >
          <span>📅 Events</span>
          <span className="admin-tab-pill">{eventsList.length}</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => { setActiveTab('team'); setSearchTerm('') }}
        >
          <span>👥 Team Members</span>
          <span className="admin-tab-pill">{teamList.length}</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'startups' ? 'active' : ''}`}
          onClick={() => { setActiveTab('startups'); setSearchTerm('') }}
        >
          <span>🚀 Startups</span>
          <span className="admin-tab-pill">{startupsList.length}</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => { setActiveTab('gallery'); setSearchTerm('') }}
        >
          <span>🖼️ Gallery</span>
          <span className="admin-tab-pill">{galleryList.length}</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'registrations' ? 'active' : ''}`}
          onClick={() => { setActiveTab('registrations'); setSearchTerm('') }}
        >
          <span>🎟️ Registrations</span>
          {metrics.pendingCount > 0 ? (
            <span className="admin-tab-pill" style={{ background: '#f59e0b', color: '#000' }}>
              {metrics.pendingCount} Review
            </span>
          ) : (
            <span className="admin-tab-pill">{metrics.totalEntries}</span>
          )}
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => { setActiveTab('messages'); setSearchTerm('') }}
        >
          <span>📬 Contact Messages</span>
          {unreadMessagesCount > 0 ? (
            <span className="admin-tab-pill" style={{ background: '#ef4444', color: '#fff' }}>
              {unreadMessagesCount} New
            </span>
          ) : (
            <span className="admin-tab-pill">{messagesList.length}</span>
          )}
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. EVENTS MANAGEMENT TAB                                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'events' && (
        <section>
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title">📅 Manage Events</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                Create, update, or archive club workshops, hackathons, and fests.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="🔍 Search events..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ width: '220px', padding: '8px 12px', fontSize: '0.85rem' }}
              />
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingItem({
                    id: '',
                    title: '',
                    tag: 'Workshops',
                    date: 'March 2026',
                    description: '',
                    meta: 'A Building, VC Hall',
                    btn_label: 'Register Now',
                    highlight: false,
                    is_past: false
                  })
                  setModalType('event')
                }}
                style={{ padding: '9px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>➕</span> Add New Event
              </button>
            </div>
          </div>

          <div className="admin-cards-grid">
            {eventsList
              .filter(ev => !searchTerm || ev.title?.toLowerCase().includes(searchTerm.toLowerCase()) || ev.tag?.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(ev => (
                <div key={ev.id} className="admin-item-card">
                  <div>
                    <div className="admin-item-header">
                      <span className="admin-tag-badge">{ev.tag || 'Event'}</span>
                      <span style={{ fontSize: '0.78rem', color: ev.is_past ? '#f87171' : '#34d399', fontWeight: 600 }}>
                        {ev.is_past ? 'ARCHIVED (PAST)' : 'UPCOMING'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '8px 0 4px', color: '#fff' }}>
                      {ev.title} {ev.highlight && <span title="Featured" style={{ fontSize: '0.8rem' }}>⭐</span>}
                    </h3>
                    <p style={{ color: 'var(--accent-light)', fontSize: '0.82rem', marginBottom: '8px' }}>
                      🗓️ {ev.date}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '12px' }}>
                      {ev.description || 'No description provided.'}
                    </p>
                    {ev.meta && (
                      <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px' }}>
                        📍 {ev.meta}
                      </div>
                    )}
                  </div>

                  <div className="admin-card-actions">
                    <button
                      className="admin-action-btn-edit"
                      onClick={() => {
                        setEditingItem({ ...ev })
                        setModalType('event')
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="admin-action-btn-del"
                      onClick={() => handleDeleteItem('event', ev.id, ev.title)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. TEAM MEMBERS MANAGEMENT TAB                                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'team' && (
        <section>
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title">👥 Manage Team Members</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                Add leadership, domain heads, and core members with photos and profiles.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="🔍 Search by name or role..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ width: '220px', padding: '8px 12px', fontSize: '0.85rem' }}
              />
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingItem({
                    id: '',
                    name: '',
                    role: 'Core Member',
                    category: 'core_member',
                    bio: '',
                    photo_url: '',
                    linkedin: '',
                    email: '',
                    phone: ''
                  })
                  setModalType('team')
                }}
                style={{ padding: '9px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>➕</span> Add Team Member
              </button>
            </div>
          </div>

          <div className="admin-cards-grid">
            {teamList
              .filter(m => !searchTerm || m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || m.role?.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(m => (
                <div key={m.id} className="admin-item-card">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                      <img
                        src={m.photo_url || m.image || '/images/success-squad-team.jpg'}
                        alt={m.name}
                        className="admin-avatar-preview"
                        onError={e => { e.target.src = '/Success Squad.jpg' }}
                      />
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                          {m.name}
                        </h3>
                        <div style={{ color: 'var(--accent-light)', fontSize: '0.85rem', fontWeight: 600 }}>
                          {m.role}
                        </div>
                        <span style={{
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                          color: 'var(--text-muted)',
                          letterSpacing: '0.5px'
                        }}>
                          {m.category?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {m.bio && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '10px' }}>
                        {m.bio}
                      </p>
                    )}

                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {m.linkedin && (
                        <a href={m.linkedin} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-2)', textDecoration: 'none' }}>
                          🔗 LinkedIn Profile ↗
                        </a>
                      )}
                      {m.email && <span>✉️ {m.email}</span>}
                    </div>
                  </div>

                  <div className="admin-card-actions">
                    <button
                      className="admin-action-btn-edit"
                      onClick={() => {
                        setEditingItem({ ...m })
                        setModalType('team')
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="admin-action-btn-del"
                      onClick={() => handleDeleteItem('team', m.id, m.name)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. STARTUPS MANAGEMENT TAB                                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'startups' && (
        <section>
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title">🚀 Manage Startups</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                Showcase student startups and incubated ventures on the Startups page.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="🔍 Search startups..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ width: '220px', padding: '8px 12px', fontSize: '0.85rem' }}
              />
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingItem({
                    id: '',
                    name: '',
                    logo_text: '',
                    tag: 'SaaS / AI',
                    description: '',
                    website: 'https://',
                    website_label: 'Visit Website ↗'
                  })
                  setModalType('startup')
                }}
                style={{ padding: '9px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>➕</span> Add Startup
              </button>
            </div>
          </div>

          <div className="admin-cards-grid">
            {startupsList
              .filter(s => !searchTerm || s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.tag?.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(s => (
                <div key={s.id} className="admin-item-card">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(6,182,212,0.25))',
                        border: '1px solid rgba(99,102,241,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        color: '#fff',
                        fontSize: '1.2rem'
                      }}>
                        {s.logo_text || s.name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                          {s.name}
                        </h3>
                        <span className="admin-tag-badge" style={{ marginTop: '4px', display: 'inline-block' }}>
                          {s.tag || 'Startup'}
                        </span>
                      </div>
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '14px' }}>
                      {s.description}
                    </p>

                    {s.website && (
                      <a
                        href={s.website}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--accent-light)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}
                      >
                        🌐 {s.website_label || s.website}
                      </a>
                    )}
                  </div>

                  <div className="admin-card-actions">
                    <button
                      className="admin-action-btn-edit"
                      onClick={() => {
                        setEditingItem({ ...s })
                        setModalType('startup')
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="admin-action-btn-del"
                      onClick={() => handleDeleteItem('startup', s.id, s.name)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. GALLERY MANAGEMENT TAB                                           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'gallery' && (
        <section>
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title">🖼️ Manage Gallery & Memories</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                Upload event photos and memories for the Gallery showcase.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="🔍 Search gallery..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ width: '220px', padding: '8px 12px', fontSize: '0.85rem' }}
              />
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingItem({
                    id: '',
                    title: '',
                    accent_title: '',
                    year: '2026',
                    category: 'album',
                    image_url: '/images/success-squad-team.jpg',
                    alt_text: ''
                  })
                  setModalType('gallery')
                }}
                style={{ padding: '9px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>➕</span> Add Gallery Item
              </button>
            </div>
          </div>

          <div className="admin-cards-grid">
            {galleryList
              .filter(g => !searchTerm || g.title?.toLowerCase().includes(searchTerm.toLowerCase()) || g.year?.includes(searchTerm))
              .map(g => (
                <div key={g.id} className="admin-item-card">
                  <div>
                    <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', height: '140px', marginBottom: '12px', background: '#000' }}>
                      <img
                        src={g.image_url || '/images/success-squad-team.jpg'}
                        alt={g.alt_text || g.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                        onError={e => { e.target.src = '/Success Squad.jpg' }}
                      />
                      <span style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(4px)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#fff'
                      }}>
                        {g.category === 'album' ? 'CAROUSEL ALBUM' : 'MEMORY CARD'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px', color: '#fff' }}>
                      {g.title} {g.accent_title && <span style={{ color: 'var(--accent-light)' }}>{g.accent_title}</span>}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                      Year: {g.year || '2026'}
                    </p>
                  </div>

                  <div className="admin-card-actions">
                    <button
                      className="admin-action-btn-edit"
                      onClick={() => {
                        setEditingItem({ ...g })
                        setModalType('gallery')
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="admin-action-btn-del"
                      onClick={() => handleDeleteItem('gallery', g.id, g.title)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. REGISTRATIONS MANAGEMENT TAB                                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'registrations' && (
        <section>
          {/* KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '14px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                👥
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Total Entries</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#ffffff' }}>{metrics.totalEntries}</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '14px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                ✅
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Verified Slots</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#34d399' }}>{metrics.verifiedCount}</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '14px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                ⏳
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Review Queue</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#fbbf24' }}>{metrics.pendingCount}</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '14px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                💰
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Collected Fees</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#22d3ee' }}>₹{metrics.totalRevenue}</div>
              </div>
            </div>
          </div>

          {/* Sub-Filters & Excel Export */}
          <div className="admin-filters" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                className={`btn ${regSubTab === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setRegSubTab('all')}
              >
                All Entries ({masterList.length})
              </button>
              <button
                className={`btn ${regSubTab === 'queue' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setRegSubTab('queue')}
              >
                Review Queue ({queue.length})
              </button>
              <button
                className={`btn ${regSubTab === 'verified' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setRegSubTab('verified')}
              >
                Verified ({regs.length})
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍 Search team, leader, phone, UTR..."
                value={regSearchTerm}
                onChange={e => setRegSearchTerm(e.target.value)}
                className="form-input"
                style={{ width: '240px', padding: '8px 12px', fontSize: '0.85rem' }}
              />

              <button
                onClick={handleExportExcel}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  fontWeight: 700
                }}
              >
                <span>📊</span> Export to Excel (.xlsx)
              </button>
            </div>
          </div>

          {/* Registrations Table */}
          {activeRegistrations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>No registrations found in this view.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Team ID / Order ID</th>
                    <th>Event</th>
                    <th>Team Name</th>
                    <th>Leader & Contact</th>
                    <th>Transaction / UTR</th>
                    <th>Amount</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRegistrations.map((r) => {
                    const isUnstop = r.status === 'pending_unstop_review'
                    const isVerified = r.status === 'verified' || r.status === 'confirmed'
                    const teamName = r.team_data?.teamName ?? '—'
                    const leaderName = r.team_data?.leaderName ?? '—'
                    const leaderPhone = r.team_data?.leaderPhone ?? ''

                    return (
                      <tr
                        key={r.id || r.order_id}
                        className="admin-table-row"
                        onClick={() => setSelectedReg(r)}
                      >
                        <td>
                          <span className={`status-badge status-${isVerified ? 'verified' : 'pending'}`}>
                            {isVerified ? 'VERIFIED' : (isUnstop ? 'UNSTOP' : 'PENDING')}
                          </span>
                        </td>
                        <td><code>{r.team_id || r.order_id}</code></td>
                        <td><span style={{ fontWeight: 600 }}>{r.event_id}</span></td>
                        <td>{teamName}</td>
                        <td>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{leaderName}</div>
                          {leaderPhone && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{leaderPhone}</div>}
                        </td>
                        <td>{r.utr ?? '—'}</td>
                        <td style={{ fontWeight: 700, color: '#34d399' }}>₹{r.amount_inr ?? 0}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Registration Review Drawer */}
          <ReviewDrawer
            row={selectedReg}
            onClose={() => setSelectedReg(null)}
            onAction={handleRegAction}
            processing={processingReg}
          />
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. CONTACT MESSAGES MANAGEMENT TAB                                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'messages' && (
        <section>
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title">📬 Contact Messages & Inquiries</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                Review incoming proposals, speaker invitations, and partnership inquiries.
              </p>
            </div>

            <input
              type="text"
              placeholder="🔍 Search messages by sender or subject..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ width: '280px', padding: '8px 12px', fontSize: '0.85rem' }}
            />
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Sender</th>
                  <th>Subject</th>
                  <th>Message Excerpt</th>
                  <th>Received</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {messagesList
                  .filter(m => !searchTerm || m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || m.email?.toLowerCase().includes(searchTerm.toLowerCase()) || m.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || m.message?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(m => (
                    <tr key={m.id} className="admin-table-row">
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: m.status === 'unread' ? 'rgba(239, 68, 68, 0.15)' : (m.status === 'replied' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)'),
                          color: m.status === 'unread' ? '#fca5a5' : (m.status === 'replied' ? '#6ee7b7' : 'var(--text-muted)')
                        }}>
                          {m.status || 'UNREAD'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--accent-light)' }}>{m.email}</div>
                      </td>
                      <td>
                        <span className="admin-tag-badge" style={{ fontSize: '0.75rem' }}>{m.subject || 'General'}</span>
                      </td>
                      <td style={{ maxWidth: '300px' }}>
                        <div style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontSize: '0.85rem',
                          color: 'var(--text-muted)'
                        }}>
                          {m.message}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {m.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="admin-action-btn-edit"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            onClick={() => {
                              setEditingItem(m)
                              setModalType('message_detail')
                              if (m.status === 'unread') {
                                handleUpdateMessageStatus(m.id, 'read')
                              }
                            }}
                          >
                            👁️ View
                          </button>
                          <a
                            href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject || 'Success Squad Inquiry')}`}
                            className="admin-action-btn-edit"
                            style={{ padding: '4px 10px', fontSize: '0.75rem', textDecoration: 'none' }}
                            onClick={() => handleUpdateMessageStatus(m.id, 'replied')}
                          >
                            ✉️ Reply
                          </a>
                          <button
                            className="admin-action-btn-del"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            onClick={() => handleDeleteItem('message', m.id, m.name)}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ADD / EDIT DIALOG                                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {modalType && modalType !== 'message_detail' && editingItem && (
        <div className="admin-modal-backdrop" onClick={e => e.target === e.currentTarget && setModalType(null)}>
          <div className="admin-modal" role="dialog">
            <button className="modal-close" onClick={() => setModalType(null)} aria-label="Close">✕</button>
            <h2 className="admin-modal-title">
              {editingItem.id ? 'Edit' : 'Add New'} {modalType.toUpperCase()}
            </h2>
            <p className="admin-modal-sub">Fill in the details below to update your live website.</p>

            <form onSubmit={handleSaveItem}>
              {/* EVENT FORM */}
              {modalType === 'event' && (
                <div className="admin-form-grid">
                  <div className="form-group admin-form-full">
                    <label>Event Title</label>
                    <input
                      type="text" required className="form-input"
                      value={editingItem.title || ''}
                      onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                      placeholder="e.g. AI Bootcamp 2026"
                    />
                  </div>

                  <div className="form-group">
                    <label>Tag / Category</label>
                    <input
                      type="text" required className="form-input"
                      value={editingItem.tag || ''}
                      onChange={e => setEditingItem({ ...editingItem, tag: e.target.value })}
                      placeholder="Workshops, Fest, Hackathon"
                    />
                  </div>

                  <div className="form-group">
                    <label>Date or Schedule</label>
                    <input
                      type="text" required className="form-input"
                      value={editingItem.date || ''}
                      onChange={e => setEditingItem({ ...editingItem, date: e.target.value })}
                      placeholder="February 18–20, 2026"
                    />
                  </div>

                  <div className="form-group admin-form-full">
                    <label>Description</label>
                    <textarea
                      rows={3} className="form-input"
                      value={editingItem.description || ''}
                      onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                      placeholder="Brief summary of the event..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Venue / Meta Info</label>
                    <input
                      type="text" className="form-input"
                      value={editingItem.meta || ''}
                      onChange={e => setEditingItem({ ...editingItem, meta: e.target.value })}
                      placeholder="A Building, VC Hall"
                    />
                  </div>

                  <div className="form-group">
                    <label>Button Label</label>
                    <input
                      type="text" className="form-input"
                      value={editingItem.btn_label || 'Register Now'}
                      onChange={e => setEditingItem({ ...editingItem, btn_label: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox" id="isPastCheckbox"
                      checked={!!editingItem.is_past}
                      onChange={e => setEditingItem({ ...editingItem, is_past: e.target.checked })}
                    />
                    <label htmlFor="isPastCheckbox" style={{ margin: 0 }}>Mark as Past Event (Archive)</label>
                  </div>

                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox" id="highlightCheckbox"
                      checked={!!editingItem.highlight}
                      onChange={e => setEditingItem({ ...editingItem, highlight: e.target.checked })}
                    />
                    <label htmlFor="highlightCheckbox" style={{ margin: 0 }}>Featured Highlight</label>
                  </div>
                </div>
              )}

              {/* TEAM MEMBER FORM */}
              {modalType === 'team' && (
                <div className="admin-form-grid">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text" required className="form-input"
                      value={editingItem.name || ''}
                      onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                      placeholder="Member name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Role / Position</label>
                    <input
                      type="text" required className="form-input"
                      value={editingItem.role || ''}
                      onChange={e => setEditingItem({ ...editingItem, role: e.target.value })}
                      placeholder="e.g. President, Events Lead"
                    />
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <select
                      className="form-input"
                      value={editingItem.category || 'core_member'}
                      onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
                    >
                      <option value="leadership">Leadership (Featured)</option>
                      <option value="domain_lead">Domain Lead</option>
                      <option value="core_member">Core Member</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Photo URL</label>
                    <input
                      type="text" className="form-input"
                      value={editingItem.photo_url || editingItem.image || ''}
                      onChange={e => setEditingItem({ ...editingItem, photo_url: e.target.value, image: e.target.value })}
                      placeholder="/images/team/member.png or URL"
                    />
                  </div>

                  <div className="form-group admin-form-full">
                    <label>Bio (Short Description)</label>
                    <textarea
                      rows={2} className="form-input"
                      value={editingItem.bio || ''}
                      onChange={e => setEditingItem({ ...editingItem, bio: e.target.value })}
                      placeholder="Background, year of study, hobbies..."
                    />
                  </div>

                  <div className="form-group">
                    <label>LinkedIn Profile URL</label>
                    <input
                      type="url" className="form-input"
                      value={editingItem.linkedin || ''}
                      onChange={e => setEditingItem({ ...editingItem, linkedin: e.target.value })}
                      placeholder="https://www.linkedin.com/in/..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email" className="form-input"
                      value={editingItem.email || ''}
                      onChange={e => setEditingItem({ ...editingItem, email: e.target.value })}
                      placeholder="member@successsquad.in"
                    />
                  </div>
                </div>
              )}

              {/* STARTUP FORM */}
              {modalType === 'startup' && (
                <div className="admin-form-grid">
                  <div className="form-group">
                    <label>Startup Name</label>
                    <input
                      type="text" required className="form-input"
                      value={editingItem.name || ''}
                      onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                      placeholder="e.g. Connexaa"
                    />
                  </div>

                  <div className="form-group">
                    <label>Logo Initials (Monogram)</label>
                    <input
                      type="text" className="form-input"
                      value={editingItem.logo_text || ''}
                      onChange={e => setEditingItem({ ...editingItem, logo_text: e.target.value })}
                      placeholder="e.g. CX"
                      maxLength={4}
                    />
                  </div>

                  <div className="form-group">
                    <label>Industry / Tag</label>
                    <input
                      type="text" className="form-input"
                      value={editingItem.tag || ''}
                      onChange={e => setEditingItem({ ...editingItem, tag: e.target.value })}
                      placeholder="Networking Platform, EdTech, AI"
                    />
                  </div>

                  <div className="form-group">
                    <label>Website URL</label>
                    <input
                      type="url" className="form-input"
                      value={editingItem.website || ''}
                      onChange={e => setEditingItem({ ...editingItem, website: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="form-group admin-form-full">
                    <label>Description</label>
                    <textarea
                      rows={3} className="form-input"
                      value={editingItem.description || ''}
                      onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                      placeholder="What the startup does and its impact..."
                    />
                  </div>
                </div>
              )}

              {/* GALLERY FORM */}
              {modalType === 'gallery' && (
                <div className="admin-form-grid">
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text" required className="form-input"
                      value={editingItem.title || ''}
                      onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                      placeholder="e.g. E-Fest, AI Bootcamp"
                    />
                  </div>

                  <div className="form-group">
                    <label>Accent Title (Optional)</label>
                    <input
                      type="text" className="form-input"
                      value={editingItem.accent_title || ''}
                      onChange={e => setEditingItem({ ...editingItem, accent_title: e.target.value })}
                      placeholder="2026, Bootcamp"
                    />
                  </div>

                  <div className="form-group">
                    <label>Year</label>
                    <input
                      type="text" className="form-input"
                      value={editingItem.year || '2026'}
                      onChange={e => setEditingItem({ ...editingItem, year: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <select
                      className="form-input"
                      value={editingItem.category || 'album'}
                      onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
                    >
                      <option value="album">Event Album (Carousel Section)</option>
                      <option value="memory">Our Memories Stack Card</option>
                    </select>
                  </div>

                  <div className="form-group admin-form-full">
                    <label>Image URL</label>
                    <input
                      type="text" required className="form-input"
                      value={editingItem.image_url || ''}
                      onChange={e => setEditingItem({ ...editingItem, image_url: e.target.value })}
                      placeholder="/images/success-squad-team.jpg or web URL"
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setModalType(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Changes →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: MESSAGE DETAIL DIALOG                                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {modalType === 'message_detail' && editingItem && (
        <div className="admin-modal-backdrop" onClick={e => e.target === e.currentTarget && setModalType(null)}>
          <div className="admin-modal" style={{ maxWidth: '540px' }} role="dialog">
            <button className="modal-close" onClick={() => setModalType(null)} aria-label="Close">✕</button>

            <span className="admin-tag-badge" style={{ marginBottom: '12px', display: 'inline-block' }}>
              {editingItem.subject || 'Inquiry'}
            </span>

            <h2 className="admin-modal-title" style={{ fontSize: '1.4rem' }}>
              {editingItem.name}
            </h2>

            <p style={{ color: 'var(--accent-light)', fontSize: '0.88rem', marginBottom: '18px' }}>
              ✉️ {editingItem.email} • ⏱ {editingItem.created_at ? new Date(editingItem.created_at).toLocaleString() : 'Recent'}
            </p>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '16px',
              lineHeight: 1.6,
              fontSize: '0.92rem',
              color: '#fff',
              whiteSpace: 'pre-wrap',
              marginBottom: '24px'
            }}>
              {editingItem.message}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="admin-action-btn-edit"
                  onClick={() => {
                    handleUpdateMessageStatus(editingItem.id, 'read')
                    setModalType(null)
                  }}
                >
                  Mark as Read
                </button>
                <button
                  className="admin-action-btn-edit"
                  onClick={() => {
                    handleUpdateMessageStatus(editingItem.id, 'archived')
                    setModalType(null)
                  }}
                >
                  Archive
                </button>
              </div>

              <a
                href={`mailto:${editingItem.email}?subject=Re: ${encodeURIComponent(editingItem.subject || 'Success Squad Inquiry')}`}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                onClick={() => {
                  handleUpdateMessageStatus(editingItem.id, 'replied')
                  setModalType(null)
                }}
              >
                ✉️ Reply via Email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
