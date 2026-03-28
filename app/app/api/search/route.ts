/**
 * POST /api/search — Search UI components via Hanzo Cloud.
 *
 * Proxies to Hanzo Cloud search-docs API with the publishable key.
 * Client-side code hits this route instead of Cloud directly.
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchEndpoint, searchIndex, publishableKey } from '@/lib/search'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { query, limit = 10, tags } = body

  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 })
  }

  const resp = await fetch(searchEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${publishableKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      index: searchIndex,
      limit,
      ...(tags ? { tags } : {}),
    }),
  })

  if (!resp.ok) {
    return NextResponse.json(
      { error: 'Search failed', status: resp.status },
      { status: resp.status },
    )
  }

  const data = await resp.json()
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
