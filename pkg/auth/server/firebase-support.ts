import 'server-only'

import { cookies } from 'next/headers'
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { type SessionCookieOptions, type UserRecord, getAuth } from 'firebase-admin/auth'
import { collection, doc, getDoc, setDoc } from 'firebase/firestore'
import { getFirestore } from 'firebase-admin/firestore'
import type { HanzoUserInfo, HanzoUserInfoValue } from '../types'

// Initialize Firebase only if credentials are present and valid
let firebaseApp: App | undefined;
try {
  const hasValidCredentials = process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY;

  if (hasValidCredentials) {
    firebaseApp =
      getApps().find((it) => it.name === 'firebase-admin-app') ||
      initializeApp(
        {
          credential: cert({
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n')
          }),
        },
        'firebase-admin-app'
      );
  } else {
    console.warn('Firebase credentials are missing or invalid. Firebase Admin SDK not initialized.');
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
  firebaseApp = undefined;
}

const USER_INFO_COLLECTION = 'USER_INFO'

const auth = getAuth(firebaseApp)
const db = getFirestore(firebaseApp as App, 'accounts')

async function isUserAuthenticated(session: string | undefined = undefined) {
  const _session = session ?? (await getSession())
  if (!_session) return false

  try {
    const isRevoked = !(await auth.verifySessionCookie(_session, true))
    return !isRevoked
  } catch (error) {
    console.log(error)
    return false
  }
}

export async function getUserServerSide(): Promise<HanzoUserInfoValue | null> {
  const session = await getSession()

  if (!(await isUserAuthenticated(session))) {
    return null
  }

  const decodedIdToken = await auth.verifySessionCookie(session!)
  const currentUser = await auth.getUser(decodedIdToken.uid)
  const walletAddress = await db.collection(USER_INFO_COLLECTION).doc(currentUser.email ?? '').get()

  return {
    email: currentUser.email ?? '',
    displayName: currentUser.displayName ?? null,
    walletAddress: walletAddress.get('walletAddress') ?? null,
  }
}

async function getSession() {
  const c = await cookies()
  try {
    return c.get('__session')?.value
  } 
  catch (error) {
    return undefined
  }
}

export const generateCustomToken = async (): Promise<{success: boolean, token: string | null}> => {
  const session = await getSession()

  if (!(await isUserAuthenticated(session))) {
    return {success: false, token: null}
  }

  const decodedIdToken = await auth.verifySessionCookie(session!)
  const currentUser = await auth.getUser(decodedIdToken.uid)

  try {
    const token = await auth.createCustomToken(currentUser.uid)
    return {success: true, token}
  } catch (e) {
    console.error('Error generating custom token', e)
    return {success: false, token: null}
  }
}

export async function createSessionCookie(idToken: string, sessionCookieOptions: SessionCookieOptions) {
  return auth.createSessionCookie(idToken, sessionCookieOptions)
}

export async function revokeAllSessions(session: string) {
  const decodedIdToken = await auth.verifySessionCookie(session)
  return await auth.revokeRefreshTokens(decodedIdToken.sub)
}
