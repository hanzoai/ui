/**
 * GET /api/registry/search?q=button — Search components.
 */

import { NextRequest, NextResponse } from "next/server"
import { searchComponents } from "../lib"

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    )
  }

  const results = searchComponents(query)

  return NextResponse.json(
    {
      query,
      total: results.length,
      results: results.map((item) => ({
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
