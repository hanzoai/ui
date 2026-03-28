/**
 * GET /api/registry/search?q=button — Search components.
 */

import { NextResponse } from "next/server"
import { getIndex } from "../lib"

export const dynamic = "force-static"

export async function GET() {
  // Static export: return full index (client-side filtering)
  const items = getIndex()

  return NextResponse.json(
    {
      total: items.length,
      results: items.map((item) => ({
        name: item.name,
        type: item.type,
        dependencies: item.dependencies,
      })),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "Access-Control-Allow-Origin": "*",
      },
    }
  )
}
