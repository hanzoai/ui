/**
 * Stub auth support — Firebase has been removed from @hanzo/auth.
 * Use @hanzo/auth-firebase for Firebase, or Hanzo IAM.
 */

import type APIResponse from '../../types/api-response'

export const auth = null
export const db = null

interface StubUser {
  email: string | null
  displayName: string | null
  getIdToken: () => Promise<string>
}

export async function loginWithProvider(_provider: string): Promise<{ success: boolean, user: StubUser | null }> {
  return { success: false, user: null }
}

export async function signupWithEmailAndPassword(
  _email: string,
  _password: string
): Promise<{ success: boolean, user?: StubUser | null, message?: string }> {
  return { success: false, user: null, message: 'Auth provider not configured' }
}

export async function loginWithEmailAndPassword(
  _email: string,
  _password: string
): Promise<{ success: boolean, user?: StubUser | null, message?: string }> {
  return { success: false, user: null, message: 'Auth provider not configured' }
}

export async function loginWithCustomToken(
  _token: string,
): Promise<{ success: boolean, user?: StubUser | null }> {
  return { success: false, user: null }
}

export async function logoutBackend(): Promise<{ success: boolean }> {
  try {
    const response = await fetch('/api/auth/logout', { headers: { 'Content-Type': 'application/json' } })
    const resBody = (await response.json()) as unknown as APIResponse<string>
    return { success: response.ok && resBody.success }
  } catch {
    return { success: false }
  }
}
