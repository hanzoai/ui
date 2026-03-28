/**
 * POST /api/chat — AI chat about UI components.
 *
 * Uses Hanzo AI (zen-coder-flash) to answer questions about
 * Hanzo UI components, props, patterns, and composition.
 * Compatible with Vercel AI SDK useChat hook.
 */

import { NextResponse } from 'next/server'

export const dynamic = "force-static"

export async function GET() {
  return NextResponse.json(
    { error: 'AI chat requires a server runtime. Use api.hanzo.ai/v1 directly.' },
    { status: 501 },
  )
}
