import { FacebookAuthProvider, GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from 'firebase/auth'

import { auth } from './firebase'
import type APIResponse from './api-response'

export async function signInWithProvider(provider: string): Promise<{success: boolean, email?: string | null}> {

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
    return {success: false}
  }

  try {
    const userCreds = await signInWithPopup(auth, authProvider)
    const idToken = await userCreds.user.getIdToken()

    const response = await fetch('/api/auth/sign-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    })
    const resBody = (await response.json()) as unknown as APIResponse<string>

    if (response.ok && resBody.success) {
      return {success: true, email: userCreds.user.email}
    } 
    else {
      return {success: false}
    }
  } 
  catch (error) {
    console.error('Error signing in with Google', error)
    return {success: false}
  }
}

export async function signOut(): Promise<{success: boolean}> {
  try {
    await auth.signOut()

    const response = await fetch('/api/auth/sign-out', {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const resBody = (await response.json()) as unknown as APIResponse<string>
    if (response.ok && resBody.success) {
      return {success: true}
    } 
    else {
      return {success: false}
    }
  } 
  catch (error) {
    console.error('Error signing out with Google', error)
    return {success: false}
  }
}
