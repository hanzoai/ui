// The dashboard decides no authority. SuperAdmin is the HOST's verdict (the server's
// `isSuperAdmin`, or @hanzo/iam `superAdmin(claims)` — a person whose home org is the
// reserved `admin` org), and the overview only carries it to the product's loader
// under that one name, so a loader can skip a fleet aggregate the viewer would be
// refused. These hold the package to that: no predicate of its own, one name.
import { describe, expect, test } from 'bun:test'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = join(import.meta.dir, '..')

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return sources(p)
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [p] : []
  })
}

describe('SuperAdmin in @hanzo/dashboard', () => {
  test('the overview hands the loader the host verdict as superAdmin', () => {
    const overview = readFileSync(join(SRC, 'overview', 'Overview.tsx'), 'utf8')
    expect(overview).toMatch(/superAdmin = false \}: \{ config: OverviewConfig; allOrgs\?: boolean; superAdmin\?: boolean \}/)
    expect(overview).toContain('.load({ range, allOrgs, superAdmin })')
    const config = readFileSync(join(SRC, 'overview', 'config.ts'), 'utf8')
    expect(config).toMatch(/\n  superAdmin\?: boolean\n/)
  })

  test('no source decides SuperAdmin itself or names it another way', () => {
    for (const file of sources(SRC)) {
      const text = readFileSync(file, 'utf8')
      expect({ file, hit: /isGlobalAdmin|global[ -]admin/i.test(text) }).toEqual({ file, hit: false })
      expect({ file, hit: /owner\s*===?\s*['"]admin['"]|orgs\?*\.?\[0\]/.test(text) }).toEqual({ file, hit: false })
    }
  })
})
