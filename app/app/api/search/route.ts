/**
 * POST /api/search — Search UI components via Hanzo Cloud.
 *
 * Proxies to Hanzo Cloud search-docs API with the publishable key.
 * Client-side code hits this route instead of Cloud directly.
 */

import { NextResponse } from 'next/server'

export const dynamic = "force-static"

export async function GET() {
  return NextResponse.json(
    { error: 'Search requires a server runtime. Use client-side search.' },
    { status: 501 },
  )
}
