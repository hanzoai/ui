/**
 * Stub Server-side Authentication
 *
 * Used when Firebase Admin is not configured.
 * All functions return null/false gracefully.
 */

import type { HanzoUserInfoValue } from '../types'

export async function getUserServerSide(): Promise<HanzoUserInfoValue | null> {
  console.warn('Server-side auth not configured. Install @hanzo/auth-firebase for Firebase support.')
  return null
}

export async function generateCustomToken(): Promise<{success: boolean, token: string | null}> {
  console.warn('Server-side auth not configured. Install @hanzo/auth-firebase for Firebase support.')
  return { success: false, token: null }
}

export async function createSessionCookie(_idToken: string, _sessionCookieOptions: any): Promise<string> {
  console.warn('Server-side auth not configured. Install @hanzo/auth-firebase for Firebase support.')
  throw new Error('Auth provider not configured')
}

export async function revokeAllSessions(_session: string): Promise<void> {
  console.warn('Server-side auth not configured. Install @hanzo/auth-firebase for Firebase support.')
  throw new Error('Auth provider not configured')
}
