import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createSessionCookie, revokeAllSessions } from './firebase-support'
import type { APIResponse } from '../types'  

export async function handleLogin(request: NextRequest) {
  const reqBody = (await request.json()) as { idToken: string }
  const idToken = reqBody.idToken

  const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days

  const sessionCookie = await createSessionCookie(idToken, { expiresIn })

  cookies().set('__session', sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: true })

  return NextResponse.json<APIResponse<string>>({ success: true, data: 'Signed in successfully.' })
}

export async function handleLogout() {
  const sessionCookie = cookies().get('__session')?.value

  if (!sessionCookie)
    return NextResponse.json<APIResponse<string>>({ success: false, error: 'Session not found.' }, { status: 400 })

  cookies().delete('__session')

  await revokeAllSessions(sessionCookie)

  return NextResponse.json<APIResponse<string>>({ success: true, data: 'Signed out successfully.' })
}
