/**
 * src/services/firebase.js
 *
 * Initialises the Firebase app lazily — only when config values are present.
 * If any required env var is missing (e.g. during local dev before .env.local
 * is set, or on Vercel before env vars are configured), we return null stubs
 * instead of crashing the entire React tree.
 *
 * Required env vars (copy .env.example → .env.local for local dev):
 *   VITE_FIREBASE_API_KEY
 *   VITE_FIREBASE_AUTH_DOMAIN
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_STORAGE_BUCKET
 *   VITE_FIREBASE_MESSAGING_SENDER_ID
 *   VITE_FIREBASE_APP_ID
 */

import { initializeApp, getApps } from 'firebase/app'
import { getFirestore }            from 'firebase/firestore'
import { getStorage }              from 'firebase/storage'
import { getAuth }                 from 'firebase/auth'

const config = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

// Only initialise if every required value is present
const isConfigured = Object.values(config).every(Boolean)

let db      = null
let storage = null
let auth    = null

if (isConfigured) {
  try {
    // Avoid duplicate app error if HMR re-runs this module
    const app = getApps().length ? getApps()[0] : initializeApp(config)
    db      = getFirestore(app)
    storage = getStorage(app)
    auth    = getAuth(app)
  } catch (err) {
    console.warn('[Firebase] Initialisation failed — registration features disabled.', err)
  }
} else {
  console.warn(
    '[Firebase] Missing env vars — registration features disabled.\n' +
    'Copy .env.example → .env.local and fill in your Firebase project config.'
  )
}

export { db, storage, auth }
