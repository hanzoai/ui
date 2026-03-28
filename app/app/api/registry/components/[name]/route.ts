/**
 * GET /api/registry/components/:name — Get component with full source.
 *
 * Returns the component JSON including embedded source code.
 */

import { NextRequest, NextResponse } from "next/server"
import { getComponent } from "../../lib"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  const component = getComponent(name)

  if (!component) {
    return NextResponse.json(
      { error: "Component not found", name },
      { status: 404 }
    )
  }

  return NextResponse.json(component, {
    headers: {
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
