/**
 * GET /api/registry/index — Full registry manifest.
 *
 * Returns ALL components with source in a single payload.
 * MCP clients can hydrate their cache with one HTTP call.
 */

import { NextResponse } from "next/server"
import { getFullManifest } from "../lib"

export const dynamic = "force-static"

export async function GET() {
  const manifest = getFullManifest()

  return NextResponse.json(manifest, {
    headers: {
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
