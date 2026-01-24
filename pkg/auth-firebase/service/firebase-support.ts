/**
 * Firebase Client-side Authentication Support
 * This module provides Firebase authentication methods for the client-side.
 */

import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  type User,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  type Auth,
} from 'firebase/auth'

import { initializeApp, getApps, FirebaseError, type FirebaseApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore, type Firestore } from 'firebase/firestore'

import type { APIResponse } from '@hanzo/auth/types'

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Check if Firebase is configured
export const isFirebaseConfigured = () => {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId)
}

// Initialize Firebase only if configured
let firebaseApp: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

if (typeof window !== 'undefined' && isFirebaseConfigured()) {
  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  auth = getAuth(firebaseApp)
  db = getFirestore(firebaseApp, 'accounts')
}

export { auth, db }

export async function loginWithProvider(provider: string): Promise<{ success: boolean, user: User | null }> {
  if (!auth) {
    console.warn('Firebase auth not configured')
    return { success: false, user: null }
  }

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
      return { success: true, user: userCreds.user }
    }
    else {
      return { success: false, user: null }
    }
  }
  catch (error) {
    console.error('Error signing in with provider', error)
    return { success: false, user: null }
  }
}

export async function signupWithEmailAndPassword(
  email: string,
  password: string
): Promise<{ success: boolean, user?: User, message?: string }> {
  if (!auth) {
    return { success: false, message: 'Firebase auth not configured' }
  }

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
  if (!auth) {
    return { success: false, message: 'Firebase auth not configured' }
  }

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
  if (!auth) {
    return { success: false }
  }

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
    console.error('Error logging out on server', error)
    return { success: false }
  }
}
