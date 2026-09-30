/**
 * src/services/firebase.js
 *
 * Initialises the Firebase app and exports the Firestore (db) and
 * Firebase Storage (storage) instances used throughout the app.
 *
 * ALL config values are read from Vite environment variables so that
 * API keys are never committed to source control.
 *
 * Required env vars (add to .env.local for local dev, Vercel project
 * settings for production — never commit actual values):
 *   VITE_FIREBASE_API_KEY
 *   VITE_FIREBASE_AUTH_DOMAIN
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_STORAGE_BUCKET
 *   VITE_FIREBASE_MESSAGING_SENDER_ID
 *   VITE_FIREBASE_APP_ID
 */

import { initializeApp } from 'firebase/app'
import { getFirestore }   from 'firebase/firestore'
import { getStorage }     from 'firebase/storage'
import { getAuth }        from 'firebase/auth'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app     = initializeApp(firebaseConfig)

export const db      = getFirestore(app)
export const storage = getStorage(app)
export const auth    = getAuth(app)
