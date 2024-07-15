
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  type User,
  signInWithEmailAndPassword,
  signInWithCustomToken,
} from 'firebase/auth'

import { initializeApp, getApps, FirebaseError } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from 'firebase/firestore'

import type APIResponse from '../../types/api-response'

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const auth = getAuth(firebaseApp)
// :aa TODO should be in module conf in host app
export const db = getFirestore(firebaseApp, 'lux-accounts')

export async function loginWithProvider(provider: string): Promise<{ success: boolean, user: User | null }> {
  const authProvider = (() => {
    switch (provider) {
      case 'google':
        return new GoogleAuthProvider()
      case 'facebook':
        return new FacebookAuthProvider()
      case 'github':
        return new GithubAuthProvider()
      default:
        return null
    }
  })()

  if (!authProvider) {
    return { success: false, user: null }
  }

  try {
    const userCreds = await signInWithPopup(auth, authProvider)
    const idToken = await userCreds.user.getIdToken()

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })
    const resBody = (await response.json()) as unknown as APIResponse<string>

    if (response.ok && resBody.success) {
      //      const walletAddress = await getAssociatedWalletAddress(userCreds.user.email ?? '')
      return { success: true, user: userCreds.user /*.email ? {email: userCreds.user.email, displayName: userCreds.user.displayName ?? undefined, walletAddress: walletAddress.result}: null */ }
    }
    else {
      return { success: false, user: null }
    }
  }
  catch (error) {
    console.error('Error signing in with Google', error)
    return { success: false, user: null }
  }
}

// https://github.com/JonDotsoy/firebase-sign-in-with-ethereum
/*
export async function signInWithEthereum(opts?: { siteName?: string }): Promise<{success: boolean, user?: HanzoUserInfo | null}> {
  const {account, signed} = await connectWalletAddress(opts?.siteName)

  let fragment = signed.slice(-10)

  const email = `${account}.${fragment}.3@${auth.app.options.authDomain}`
  const password = signed

  try {
    const res = await signInWithEmailPassword(email, password, account)
    associateWalletAddressWithAccount(email, account)
    return {success: true, user: res.user}
  } catch (e) {
    return {success: false}
  }
}
*/
const isAuthUserNotFound = (e: any) => (
  typeof e === 'object' &&
  e !== null &&
  e.hasOwnProperty('code') &&
  e.code === 'auth/user-not-found'
)

export async function signupWithEmailAndPassword(
  email: string,
  password: string
): Promise<{ success: boolean, user?: User, message?: string }> {

  let user: User | undefined = undefined
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    user = userCredential.user
  }
  catch (error) {
    if (error instanceof FirebaseError) {
      console.error(error.code)
      return {success: false, message: error.code as string}
    }
    return {success: false, message: error as string}
  }

  try {
    const idToken = await user.getIdToken()

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })
    const resBody = (await response.json()) as unknown as APIResponse<string>

    if (response.ok && resBody.success) {
      return { success: true, user }
    }
    else {
      return { success: false }
    }
  }
  catch (error) {
    console.error('Error signing in with Firebase auth', error)
    return { success: false }
  }
}

export async function loginWithEmailAndPassword(
  email: string,
  password: string
): Promise<{ success: boolean, user?: User, message?: string }> {

  let user: User | undefined = undefined
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    user = userCredential.user
  } catch (error) {
    if (error instanceof FirebaseError) {
      console.error(error.code)
      return {success: false, message: error.code as string}
    }
    return {success: false, message: error as string}
  }

  try {
    const idToken = await user.getIdToken()

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })
    const resBody = (await response.json()) as unknown as APIResponse<string>

    if (response.ok && resBody.success) {
      return { success: true, user, message: "Login Successfully!" }
    }
    else {
      return { success: false , message: "Login API Failed"}
    }
  }
  catch (error) {
    console.error('Error signing in with Firebase auth', error)
    return { success: false, message: "Error signing in with Firebase auth" }
  }
}

export async function loginWithCustomToken(
  token: string,
): Promise<{ success: boolean, user?: User }> {

  let user: User | undefined = undefined
  const userCredential = await signInWithCustomToken(auth, token)
  user = userCredential.user

  try {
    const idToken = await user.getIdToken()

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })
    const resBody = (await response.json()) as unknown as APIResponse<string>

    if (response.ok && resBody.success) {
      return { success: true, user }
    }
    else {
      return { success: false }
    }
  }
  catch (error) {
    console.error('Error signing in with Firebase auth', error)
    return { success: false }
  }
}

export async function logoutBackend(): Promise<{ success: boolean }> {

  try {
    const response = await fetch('/api/auth/logout', { headers: { 'Content-Type': 'application/json' } })
    const resBody = (await response.json()) as unknown as APIResponse<string>
    if (response.ok && resBody.success) {
      return { success: true }
    }
    else {
      return { success: false }
    }
  }

  catch (error) {
    console.error('Error logging on on server with Firebase', error)
    return { success: false }
  }
}

