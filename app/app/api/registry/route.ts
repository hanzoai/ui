/**
 * GET /api/registry — List all components (index).
 *
 * Query params:
 *   ?type=components:ui  — filter by type
 */

import { NextRequest, NextResponse } from "next/server"
import { listByType } from "./lib"

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") ?? undefined
  const items = listByType(type)

  return NextResponse.json(
    {
      total: items.length,
      components: items.map((item) => ({
        name: item.name,
        type: item.type,
        dependencies: item.dependencies,
        registryDependencies: item.registryDependencies,
      })),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
        "Access-Control-Allow-Origin": "*",
      },
    }
  )
}
