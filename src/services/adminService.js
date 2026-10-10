/**
 * src/services/adminService.js
 *
 * Supabase service layer for managing website content and submissions:
 * - Events (Upcoming & Past)
 * - Team Members (Leadership, Domain Leads, Core)
 * - Startups
 * - Gallery & Memories
 * - Contact Messages
 *
 * Provides resilient fallback caching (localStorage) when Supabase tables
 * are not yet created or while working in offline/demo mode.
 */

import { supabase } from './supabase.js'
import { upcomingEvents, pastEvents } from '../data/eventsData.js'
import { leadership, domainLeads, coreMembers } from '../data/teamData.js'
import { startupsData } from '../data/startupsData.js'
import { galleryData, memoriesImages } from '../data/galleryData.js'

// Helper for local caching to ensure zero data loss during migrations/preview
const CACHE_KEYS = {
  EVENTS: 'ss_admin_events_cache',
  TEAM: 'ss_admin_team_cache',
  STARTUPS: 'ss_admin_startups_cache',
  GALLERY: 'ss_admin_gallery_cache',
  MESSAGES: 'ss_admin_messages_cache',
}

function getCached(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function setCached(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.warn('LocalStorage save failed:', e)
  }
}

// ── 1. EVENTS SERVICE ────────────────────────────────────────────────────────

const DEFAULT_EVENTS = [
  ...upcomingEvents.map(e => ({
    id: e.id,
    title: e.title,
    tag: e.tag,
    date: e.date,
    description: e.description,
    meta: Array.isArray(e.meta) ? e.meta.join(' • ') : (e.meta || ''),
    btn_label: e.btnLabel || 'Register',
    highlight: !!e.highlight,
    is_past: false,
    year: '2026',
    created_at: new Date().toISOString()
  })),
  ...pastEvents.map(e => ({
    id: e.id,
    title: e.title,
    tag: e.tag,
    date: e.year,
    description: e.description,
    meta: 'Past Event Archive',
    btn_label: 'View Archive',
    highlight: false,
    is_past: true,
    year: e.year,
    created_at: new Date().toISOString()
  }))
]

export async function fetchEvents() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data && data.length > 0) {
        setCached(CACHE_KEYS.EVENTS, data)
        return data
      }
    } catch (e) {
      console.warn('[Admin] Falling back to cached events:', e)
    }
  }
  return getCached(CACHE_KEYS.EVENTS, DEFAULT_EVENTS)
}

export async function saveEvent(eventItem) {
  const itemToSave = {
    ...eventItem,
    id: eventItem.id || `event-${Date.now()}`,
    created_at: eventItem.created_at || new Date().toISOString()
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('events')
        .upsert(itemToSave)
        .select()
      if (!error && data) {
        // Refresh local cache
        const current = getCached(CACHE_KEYS.EVENTS, DEFAULT_EVENTS)
        const updated = [itemToSave, ...current.filter(i => i.id !== itemToSave.id)]
        setCached(CACHE_KEYS.EVENTS, updated)
        return data[0] || itemToSave
      }
    } catch (e) {
      console.warn('[Admin] Supabase saveEvent error, using local state:', e)
    }
  }

  const current = getCached(CACHE_KEYS.EVENTS, DEFAULT_EVENTS)
  const updated = [itemToSave, ...current.filter(i => i.id !== itemToSave.id)]
  setCached(CACHE_KEYS.EVENTS, updated)
  return itemToSave
}

export async function deleteEvent(id) {
  if (supabase) {
    try {
      await supabase.from('events').delete().eq('id', id)
    } catch (e) {
      console.warn('[Admin] Supabase deleteEvent error:', e)
    }
  }
  const current = getCached(CACHE_KEYS.EVENTS, DEFAULT_EVENTS)
  const updated = current.filter(i => i.id !== id)
  setCached(CACHE_KEYS.EVENTS, updated)
  return true
}

// ── 2. TEAM MEMBERS SERVICE ──────────────────────────────────────────────────

const DEFAULT_TEAM = [
  ...leadership.map(m => ({
    id: m.id,
    name: m.name,
    role: m.role,
    category: 'leadership',
    bio: m.bio || '',
    image: m.photoUrl || m.image || '',
    linkedin: m.linkedin || '',
    email: m.email || '',
    phone: m.phone || '',
    created_at: new Date().toISOString()
  })),
  ...domainLeads.map(m => ({
    id: m.id,
    name: m.name,
    role: m.role,
    category: 'domain_lead',
    bio: m.bio || '',
    image: m.photoUrl || m.image || '',
    linkedin: m.linkedin || '',
    email: m.email || '',
    phone: m.phone || '',
    created_at: new Date().toISOString()
  })),
  ...coreMembers.map(m => ({
    id: m.id,
    name: m.name,
    role: m.role,
    category: 'core_member',
    bio: m.bio || '',
    image: m.photoUrl || m.image || '',
    linkedin: m.linkedin || '',
    email: m.email || '',
    phone: m.phone || '',
    created_at: new Date().toISOString()
  }))
]

export async function fetchTeamMembers() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: true })
      if (!error && data && data.length > 0) {
        setCached(CACHE_KEYS.TEAM, data)
        return data
      }
    } catch (e) {
      console.warn('[Admin] Falling back to cached team members:', e)
    }
  }
  return getCached(CACHE_KEYS.TEAM, DEFAULT_TEAM)
}

export async function saveTeamMember(member) {
  const itemToSave = {
    ...member,
    id: member.id || `member-${Date.now()}`,
    created_at: member.created_at || new Date().toISOString()
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .upsert(itemToSave)
        .select()
      if (!error && data) {
        const current = getCached(CACHE_KEYS.TEAM, DEFAULT_TEAM)
        const updated = [itemToSave, ...current.filter(i => i.id !== itemToSave.id)]
        setCached(CACHE_KEYS.TEAM, updated)
        return data[0] || itemToSave
      }
    } catch (e) {
      console.warn('[Admin] Supabase saveTeamMember error:', e)
    }
  }

  const current = getCached(CACHE_KEYS.TEAM, DEFAULT_TEAM)
  const updated = [itemToSave, ...current.filter(i => i.id !== itemToSave.id)]
  setCached(CACHE_KEYS.TEAM, updated)
  return itemToSave
}

export async function deleteTeamMember(id) {
  if (supabase) {
    try {
      await supabase.from('team_members').delete().eq('id', id)
    } catch (e) {
      console.warn('[Admin] Supabase deleteTeamMember error:', e)
    }
  }
  const current = getCached(CACHE_KEYS.TEAM, DEFAULT_TEAM)
  const updated = current.filter(i => i.id !== id)
  setCached(CACHE_KEYS.TEAM, updated)
  return true
}

// ── 3. STARTUPS SERVICE ──────────────────────────────────────────────────────

const DEFAULT_STARTUPS = startupsData.map(s => ({
  id: s.id,
  name: s.name,
  tag: s.tag,
  logo_text: s.logoText || s.name.substring(0, 2).toUpperCase(),
  description: s.description,
  website: s.website,
  website_label: s.websiteLabel || `Visit ${s.name} ↗`,
  created_at: new Date().toISOString()
}))

export async function fetchStartups() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('startups')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data && data.length > 0) {
        setCached(CACHE_KEYS.STARTUPS, data)
        return data
      }
    } catch (e) {
      console.warn('[Admin] Falling back to cached startups:', e)
    }
  }
  return getCached(CACHE_KEYS.STARTUPS, DEFAULT_STARTUPS)
}

export async function saveStartup(startup) {
  const itemToSave = {
    ...startup,
    id: startup.id || `startup-${Date.now()}`,
    created_at: startup.created_at || new Date().toISOString()
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('startups')
        .upsert(itemToSave)
        .select()
      if (!error && data) {
        const current = getCached(CACHE_KEYS.STARTUPS, DEFAULT_STARTUPS)
        const updated = [itemToSave, ...current.filter(i => i.id !== itemToSave.id)]
        setCached(CACHE_KEYS.STARTUPS, updated)
        return data[0] || itemToSave
      }
    } catch (e) {
      console.warn('[Admin] Supabase saveStartup error:', e)
    }
  }

  const current = getCached(CACHE_KEYS.STARTUPS, DEFAULT_STARTUPS)
  const updated = [itemToSave, ...current.filter(i => i.id !== itemToSave.id)]
  setCached(CACHE_KEYS.STARTUPS, updated)
  return itemToSave
}

export async function deleteStartup(id) {
  if (supabase) {
    try {
      await supabase.from('startups').delete().eq('id', id)
    } catch (e) {
      console.warn('[Admin] Supabase deleteStartup error:', e)
    }
  }
  const current = getCached(CACHE_KEYS.STARTUPS, DEFAULT_STARTUPS)
  const updated = current.filter(i => i.id !== id)
  setCached(CACHE_KEYS.STARTUPS, updated)
  return true
}

// ── 4. GALLERY SERVICE ───────────────────────────────────────────────────────

const DEFAULT_GALLERY = [
  ...galleryData.map(g => ({
    id: g.id,
    title: g.title,
    accent_title: g.accentTitle || '',
    year: g.year || '2026',
    category: 'album',
    image_url: g.slides?.[0]?.src || '/images/success-squad-team.jpg',
    slides_count: g.slides?.length || 1,
    alt_text: g.slides?.[0]?.alt || g.title,
    created_at: new Date().toISOString()
  })),
  ...memoriesImages.map(m => ({
    id: m.id,
    title: m.alt || 'Squad Memory',
    accent_title: '',
    year: '2025–2026',
    category: 'memory',
    image_url: m.src,
    slides_count: 1,
    alt_text: m.alt || 'Memory image',
    created_at: new Date().toISOString()
  }))
]

export async function fetchGalleryItems() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data && data.length > 0) {
        setCached(CACHE_KEYS.GALLERY, data)
        return data
      }
    } catch (e) {
      console.warn('[Admin] Falling back to cached gallery:', e)
    }
  }
  return getCached(CACHE_KEYS.GALLERY, DEFAULT_GALLERY)
}

export async function saveGalleryItem(item) {
  const itemToSave = {
    ...item,
    id: item.id || `gallery-${Date.now()}`,
    created_at: item.created_at || new Date().toISOString()
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('gallery_items')
        .upsert(itemToSave)
        .select()
      if (!error && data) {
        const current = getCached(CACHE_KEYS.GALLERY, DEFAULT_GALLERY)
        const updated = [itemToSave, ...current.filter(i => i.id !== itemToSave.id)]
        setCached(CACHE_KEYS.GALLERY, updated)
        return data[0] || itemToSave
      }
    } catch (e) {
      console.warn('[Admin] Supabase saveGalleryItem error:', e)
    }
  }

  const current = getCached(CACHE_KEYS.GALLERY, DEFAULT_GALLERY)
  const updated = [itemToSave, ...current.filter(i => i.id !== itemToSave.id)]
  setCached(CACHE_KEYS.GALLERY, updated)
  return itemToSave
}

export async function deleteGalleryItem(id) {
  if (supabase) {
    try {
      await supabase.from('gallery_items').delete().eq('id', id)
    } catch (e) {
      console.warn('[Admin] Supabase deleteGalleryItem error:', e)
    }
  }
  const current = getCached(CACHE_KEYS.GALLERY, DEFAULT_GALLERY)
  const updated = current.filter(i => i.id !== id)
  setCached(CACHE_KEYS.GALLERY, updated)
  return true
}

// ── 5. CONTACT MESSAGES SERVICE ──────────────────────────────────────────────

const SAMPLE_MESSAGES = [
  {
    id: 'msg-1',
    name: 'Aarav Deshmukh',
    email: 'aarav.d@gmail.com',
    subject: 'Submit a Startup Idea',
    message: 'Hello Success Squad! I am building an AI-powered logistics routing tool for campus events and would love to get mentored by the team.',
    status: 'unread',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'msg-2',
    name: 'Pooja Kulkarni',
    email: 'pooja.k@rediffmail.com',
    subject: 'Sponsor Success Squad',
    message: 'We are representing a Pune tech incubator and are interested in supporting E-Fest 2026 track awards.',
    status: 'read',
    created_at: new Date(Date.now() - 3600000 * 26).toISOString()
  },
  {
    id: 'msg-3',
    name: 'Rohan Sharma',
    email: 'rohan.s@outlook.com',
    subject: 'Join the Success Squad Team',
    message: 'Second year mechanical engineering student here, experienced in event hosting and multimedia coordination.',
    status: 'replied',
    created_at: new Date(Date.now() - 3600000 * 72).toISOString()
  }
]

export async function fetchContactMessages() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data && data.length > 0) {
        setCached(CACHE_KEYS.MESSAGES, data)
        return data
      }
    } catch (e) {
      console.warn('[Admin] Falling back to cached contact messages:', e)
    }
  }
  return getCached(CACHE_KEYS.MESSAGES, SAMPLE_MESSAGES)
}

export async function updateMessageStatus(id, newStatus) {
  if (supabase) {
    try {
      await supabase
        .from('contact_messages')
        .update({ status: newStatus })
        .eq('id', id)
    } catch (e) {
      console.warn('[Admin] Supabase updateMessageStatus error:', e)
    }
  }

  const current = getCached(CACHE_KEYS.MESSAGES, SAMPLE_MESSAGES)
  const updated = current.map(m => m.id === id ? { ...m, status: newStatus } : m)
  setCached(CACHE_KEYS.MESSAGES, updated)
  return updated
}

export async function deleteContactMessage(id) {
  if (supabase) {
    try {
      await supabase.from('contact_messages').delete().eq('id', id)
    } catch (e) {
      console.warn('[Admin] Supabase deleteContactMessage error:', e)
    }
  }
  const current = getCached(CACHE_KEYS.MESSAGES, SAMPLE_MESSAGES)
  const updated = current.filter(m => m.id !== id)
  setCached(CACHE_KEYS.MESSAGES, updated)
  return true
}
