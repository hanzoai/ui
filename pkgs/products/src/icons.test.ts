import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { describe, expect, it, vi } from "vitest"
import { SNAPSHOT } from "./snapshot"

const req = createRequire(import.meta.url)

// @hanzogui/lucide-icons-2 ships a bundler-only ESM (raw node/vitest can't eval it;
// console2 consumes it via Next transpilePackages, and tsup marks it external — so
// the package builds fine). Two bundler-INDEPENDENT proofs:
//   1. the map LOGIC, over a mocked icon module;
//   2. the drift guard, over the REAL exported names read from the shipped
//      type declarations (a text parse — no ESM eval).

vi.mock("@hanzogui/lucide-icons-2", () => ({
  Network: () => null,
  Brain: () => null,
  Box: () => null,
}))

describe("iconComponent (iconKey -> component) — map logic", () => {
  it("resolves a known name, undefined for unknown, falls back to Box", async () => {
    const { iconComponent, hasIcon, iconComponentOr } = await import("./icons")
    expect(iconComponent("Network")).toBeTruthy()
    expect(hasIcon("Network")).toBe(true)
    expect(iconComponent("__nope__")).toBeUndefined()
    expect(hasIcon("__nope__")).toBe(false)
    expect(iconComponentOr("__nope__")).toBe(iconComponent("Box"))
    expect(iconComponentOr("Network")).toBe(iconComponent("Network"))
  })
})

/** The real exported icon names, read from the shipped `types/index.d.ts`. */
function realIconNames(): Set<string> {
  const pkgJson = req.resolve("@hanzogui/lucide-icons-2/package.json")
  const dts = readFileSync(join(dirname(pkgJson), "types", "index.d.ts"), "utf8")
  return new Set([...dts.matchAll(/export\s*\{\s*([A-Za-z0-9_]+)\s*\}/g)].map((m) => m[1]))
}

describe("icon drift guard — every snapshot iconKey is a real @hanzogui icon", () => {
  const names = realIconNames()

  it("the shipped set is the full lucide-icons-2 vocabulary", () => {
    expect(names.size).toBeGreaterThan(1500)
    for (const n of ["Network", "Brain", "Server", "FunctionSquare", "Code2"]) expect(names.has(n), n).toBe(true)
  })

  it("resolves for all 95 products (same names docs resolves against lucide-react)", () => {
    const missing = SNAPSHOT.filter((e) => !names.has(e.iconKey)).map((e) => `${e.id}:${e.iconKey}`)
    expect(missing, `unresolved iconKeys: ${missing.join(", ")}`).toEqual([])
  })
})
