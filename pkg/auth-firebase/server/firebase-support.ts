/**
 * Server-side Firebase authentication
 * For static builds, these functions return null/false gracefully.
 */

import type { HanzoUserInfoValue } from '@hanzo/auth'

/**
 * Check if Firebase Admin is properly configured
 */
export function isFirebaseAdminConfigured(): boolean {
  return !!(
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_PRIVATE_KEY
  )
}

/**
 * Get the current user from server-side session cookie
 */
export async function getUserServerSide(): Promise<HanzoUserInfoValue | null> {
  // Check if we're in a server environment
  if (typeof window !== 'undefined') {
    return null
  }

  try {
    // Dynamic imports to prevent bundling issues in static export
    const { cookies } = await import('next/headers')
    const { initializeApp, getApps, cert } = await import('firebase-admin/app')
    type App = Awaited<ReturnType<typeof initializeApp>>
    const { getAuth } = await import('firebase-admin/auth')
    const { getFirestore } = await import('firebase-admin/firestore')

    if (!isFirebaseAdminConfigured()) {
      console.warn('Firebase credentials not configured')
      return null
    }

    const firebaseApp = getApps().find((it) => it.name === 'firebase-admin-app') ||
      initializeApp({
        credential: cert({
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n')
        }),
      }, 'firebase-admin-app')

    const auth = getAuth(firebaseApp)
    const db = getFirestore(firebaseApp as App, 'accounts')

    const c = await cookies()
    const session = c.get('__session')?.value

    if (!session) return null

    try {
      const isRevoked = !(await auth.verifySessionCookie(session, true))
      if (isRevoked) return null
    } catch {
      return null
    }

    const decodedIdToken = await auth.verifySessionCookie(session)
    const currentUser = await auth.getUser(decodedIdToken.uid)
    const walletAddress = await db.collection('USER_INFO').doc(currentUser.email ?? '').get()

    return {
      email: currentUser.email ?? '',
      displayName: currentUser.displayName ?? null,
      walletAddress: walletAddress.get('walletAddress') ?? null,
    }
  } catch (error) {
    console.warn('Server-side auth not available:', error)
    return null
  }
}

/**
 * Generate a custom token for the current session
 */
export async function generateCustomToken(): Promise<{success: boolean, token: string | null}> {
  if (typeof window !== 'undefined') {
    return { success: false, token: null }
  }

  try {
    const { cookies } = await import('next/headers')
    const { initializeApp, getApps, cert } = await import('firebase-admin/app')
    const { getAuth } = await import('firebase-admin/auth')

    if (!isFirebaseAdminConfigured()) {
      return { success: false, token: null }
    }

    const firebaseApp = getApps().find((it) => it.name === 'firebase-admin-app') ||
      initializeApp({
        credential: cert({
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n')
        }),
      }, 'firebase-admin-app')

    const auth = getAuth(firebaseApp)
    const c = await cookies()
    const session = c.get('__session')?.value

    if (!session) return { success: false, token: null }

    const decodedIdToken = await auth.verifySessionCookie(session)
    const currentUser = await auth.getUser(decodedIdToken.uid)
    const token = await auth.createCustomToken(currentUser.uid)

    return { success: true, token }
  } catch (error) {
    console.warn('Token generation not available:', error)
    return { success: false, token: null }
  }
}

/**
 * Create a session cookie from an ID token
 */
export async function createSessionCookie(idToken: string, sessionCookieOptions: any) {
  try {
    const { initializeApp, getApps, cert } = await import('firebase-admin/app')
    const { getAuth } = await import('firebase-admin/auth')

    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase not configured')
    }

    const firebaseApp = getApps().find((it) => it.name === 'firebase-admin-app') ||
      initializeApp({
        credential: cert({
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n')
        }),
      }, 'firebase-admin-app')

    const auth = getAuth(firebaseApp)
    return auth.createSessionCookie(idToken, sessionCookieOptions)
  } catch (error) {
    console.warn('Session cookie creation not available:', error)
    throw error
  }
}

/**
 * Revoke all sessions for the current user
 */
export async function revokeAllSessions(session: string) {
  try {
    const { initializeApp, getApps, cert } = await import('firebase-admin/app')
    const { getAuth } = await import('firebase-admin/auth')

    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase not configured')
    }

    const firebaseApp = getApps().find((it) => it.name === 'firebase-admin-app') ||
      initializeApp({
        credential: cert({
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n')
        }),
      }, 'firebase-admin-app')

    const auth = getAuth(firebaseApp)
    const decodedIdToken = await auth.verifySessionCookie(session)
    return await auth.revokeRefreshTokens(decodedIdToken.sub)
  } catch (error) {
    console.warn('Session revocation not available:', error)
    throw error
  }
}
