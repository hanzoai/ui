/**
 * @deprecated Firebase Admin support has been removed from @hanzo/auth.
 * Use @hanzo/auth-firebase for Firebase server-side auth, or configure
 * Hanzo IAM as your auth provider.
 *
 * All exports are stubs that return graceful failures.
 */

import type { HanzoUserInfoValue } from '../types'

export async function getUserServerSide(): Promise<HanzoUserInfoValue | null> {
  return null
}

export async function generateCustomToken(): Promise<{success: boolean, token: string | null}> {
  return { success: false, token: null }
}

export async function createSessionCookie(_idToken: string, _sessionCookieOptions: any): Promise<string> {
  throw new Error('Auth provider not configured. Use @hanzo/auth-firebase or Hanzo IAM.')
}

export async function revokeAllSessions(_session: string): Promise<void> {
  throw new Error('Auth provider not configured. Use @hanzo/auth-firebase or Hanzo IAM.')
}
