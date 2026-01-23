// Server-side Firebase authentication
// For static builds, these functions return null/false

import type { HanzoUserInfoValue } from '../types'

// These functions require server-side environment (not available in static export)
// They will return null/false gracefully when running in static context

export async function getUserServerSide(): Promise<HanzoUserInfoValue | null> {
  // Check if we're in a server environment with the required modules
  if (typeof window !== 'undefined') {
    // Client-side: auth should be handled via client-side Firebase
    return null
  }

  try {
    // Dynamic imports to prevent bundling issues in static export
    const { cookies } = await import('next/headers')
    const { initializeApp, getApps, cert } = await import('firebase-admin/app')
    type App = Awaited<ReturnType<typeof initializeApp>>
    const { getAuth } = await import('firebase-admin/auth')
    const { getFirestore } = await import('firebase-admin/firestore')

    const hasValidCredentials = process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY

    if (!hasValidCredentials) {
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

export const generateCustomToken = async (): Promise<{success: boolean, token: string | null}> => {
  // For static builds, this functionality is not available
  if (typeof window !== 'undefined') {
    return { success: false, token: null }
  }

  try {
    const { cookies } = await import('next/headers')
    const { initializeApp, getApps, cert } = await import('firebase-admin/app')
    const { getAuth } = await import('firebase-admin/auth')

    const hasValidCredentials = process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY

    if (!hasValidCredentials) {
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

export async function createSessionCookie(idToken: string, sessionCookieOptions: any) {
  try {
    const { initializeApp, getApps, cert } = await import('firebase-admin/app')
    const { getAuth } = await import('firebase-admin/auth')

    const hasValidCredentials = process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY

    if (!hasValidCredentials) {
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

export async function revokeAllSessions(session: string) {
  try {
    const { initializeApp, getApps, cert } = await import('firebase-admin/app')
    const { getAuth } = await import('firebase-admin/auth')

    const hasValidCredentials = process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY

    if (!hasValidCredentials) {
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
