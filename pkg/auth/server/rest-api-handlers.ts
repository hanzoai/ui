import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createSessionCookie, revokeAllSessions } from './stub-server'
import type { APIResponse } from '../types'

export async function handleLogin(request: NextRequest) {
  const reqBody = (await request.json()) as { idToken: string }
  const idToken = reqBody.idToken

  const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days

  const sessionCookie = await createSessionCookie(idToken, { expiresIn })

  const c = await cookies()
  c.set('__session', sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: true })

  return NextResponse.json<APIResponse<string>>({ success: true, data: 'Signed in successfully.' })
}

export async function handleLogout() {
  const c = await cookies()
  const sessionCookie = c.get('__session')?.value

  if (!sessionCookie) {
    return NextResponse.json<APIResponse<string>>({ success: false, error: 'Session not found.' }, { status: 400 })
  }

  c.delete('__session')

  await revokeAllSessions(sessionCookie)

  return NextResponse.json<APIResponse<string>>({ success: true, data: 'Signed out successfully.' })
}
