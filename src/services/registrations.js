/**
 * src/services/registrations.js
 *
 * All Firestore + Storage operations for event registrations.
 *
 * Functions:
 *  createRegistration  — validates, uploads screenshot, generates unique Team ID,
 *                        writes Firestore doc. Returns the Team ID string.
 *  getRegistrationByTeamId — fetch a single registration for status lookup.
 *  markVerified        — admin action: sets status:"verified" + verifiedAt.
 *  listRegistrations   — admin action: fetch all (or per-event) registrations.
 *
 * Security model:
 *  - CREATE is public (guarded by Firestore rules + this code)
 *  - READ/UPDATE requires Firebase Auth (admin email whitelist — see firestore.rules)
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from './firebase.js'

const REGISTRATIONS = 'registrations'
const COUNTERS      = 'counters'

// ── Unique Team ID generator ────────────────────────────────────────────────
// Uses a Firestore transaction on a per-event counter doc to guarantee
// uniqueness without requiring a sequential scan. Format: BGMI-00001

async function generateTeamId(eventPrefix) {
  const counterRef = doc(db, COUNTERS, eventPrefix)
  const teamId = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef)
    const next = snap.exists() ? snap.data().count + 1 : 1
    tx.set(counterRef, { count: next })
    return `${eventPrefix}-${String(next).padStart(5, '0')}`
  })
  return teamId
}

// ── createRegistration ───────────────────────────────────────────────────────
/**
 * @param {string} eventId        - e.g. 'bgmi-lec'
 * @param {object} formData       - validated form data from TeamDetailsStep
 * @param {File}   screenshotFile - payment screenshot (already client-validated)
 * @returns {string} teamId       - the generated unique Team ID (e.g. BGMI-00001)
 */
export async function createRegistration(eventId, formData, screenshotFile) {
  // 1. Upload screenshot to Storage
  const storageRef = ref(
    storage,
    `payment-proofs/${eventId}/${Date.now()}_${screenshotFile.name}`
  )
  await uploadBytes(storageRef, screenshotFile)
  const screenshotUrl = await getDownloadURL(storageRef)

  // 2. Generate a guaranteed-unique Team ID
  const prefixMap = {
    'bgmi-lec':      'BGMI',
    'fflec':         'FFLEC',
    'hackathon-24h': 'HACK',
    'ipl-auction':   'IPL',
    'startup-pitch': 'PITCH',
    'mun':           'MUN',
  }
  const prefix = prefixMap[eventId] ?? eventId.toUpperCase().slice(0, 6)
  const teamId = await generateTeamId(prefix)

  // 3. Write Firestore document
  // NOTE: Firestore rules enforce status === 'pending' on create,
  // so this value must match or the write will be rejected.
  await addDoc(collection(db, REGISTRATIONS), {
    eventId,
    teamId,
    status: 'pending',  // Firestore rule validates this
    screenshotUrl,
    submittedAt: serverTimestamp(),
    // Form data fields
    leaderName:  formData.leaderName,
    leaderPhone: formData.leaderPhone,
    leaderEmail: formData.leaderEmail,
    teamName:    formData.teamName,
    members: formData.members, // array of { name, email }
  })

  return teamId
}

// ── getRegistrationByTeamId ──────────────────────────────────────────────────
/**
 * Public read (validated by Firestore rules to only allow matching teamId).
 * Returns the registration document data or null if not found.
 * @param {string} teamId
 */
export async function getRegistrationByTeamId(teamId) {
  const q = query(
    collection(db, REGISTRATIONS),
    where('teamId', '==', teamId)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const docSnap = snap.docs[0]
  return { id: docSnap.id, ...docSnap.data() }
}

// ── markVerified ─────────────────────────────────────────────────────────────
/**
 * Admin action — sets status:"verified" and records verifiedAt timestamp.
 * Firestore rules require an authenticated admin to call this.
 * @param {string} docId - Firestore document ID
 */
export async function markVerified(docId) {
  const ref = doc(db, REGISTRATIONS, docId)
  await updateDoc(ref, {
    status:     'verified',
    verifiedAt: serverTimestamp(),
  })
}

// ── listRegistrations ─────────────────────────────────────────────────────────
/**
 * Admin action — fetch all registrations, optionally filtered by eventId.
 * Returns an array of { id, ...data } objects sorted by submittedAt desc.
 * @param {string|null} eventId - pass null to fetch all events
 */
export async function listRegistrations(eventId = null) {
  let q = eventId
    ? query(
        collection(db, REGISTRATIONS),
        where('eventId', '==', eventId),
        orderBy('submittedAt', 'desc')
      )
    : query(collection(db, REGISTRATIONS), orderBy('submittedAt', 'desc'))

  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
