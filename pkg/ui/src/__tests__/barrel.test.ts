import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The two barrels must agree.
 *
 * `src/backends/gui/index.ts` is the surface; `src/index.ts` re-exports it for
 * consumers. Nothing generates the second from the first — `gen-primitives.mjs`
 * writes `src/primitives/`, not this — so the root list is hand-maintained while
 * its own comment claimed otherwise, and it drifted: Glass, Grid, Section and
 * CardMedia were exported by the backend and missing from the root. The failure
 * is total and silent from the consumer's side — the component exists, the docs
 * name it, and `import { Grid } from '@hanzo/ui'` is `undefined`.
 *
 * Reading source text rather than importing: this must hold for what is
 * DECLARED, and a runtime import would need the whole gui runtime to answer a
 * question about two lists.
 */
const read = (rel: string) => readFileSync(join(__dirname, '..', rel), 'utf8')

/** Value member names from every `export { … } from './module'` block. */
const members = (src: string): Set<string> => {
  const out = new Set<string>()
  for (const block of src.matchAll(/export\s*\{([^}]*)\}\s*from\s*'([^']+)'/g)) {
    for (const raw of block[1].split(',')) {
      const name = raw.trim()
      if (!name || name.startsWith('type ')) continue
      out.add(name.includes(' as ') ? name.split(/\s+as\s+/)[1].trim() : name)
    }
  }
  return out
}

describe('the public barrel mirrors the gui backend', () => {
  it('exports every value the backend exports', () => {
    const backend = members(read('backends/gui/index.ts'))
    const root = members(read('index.ts'))

    // A guard over an empty set passes for the wrong reason.
    expect(backend.size).toBeGreaterThan(40)

    const missing = [...backend].filter((m) => !root.has(m)).sort()
    expect(
      missing,
      `exported by backends/gui and NOT importable from '@hanzo/ui':\n  ${missing.join('\n  ')}`,
    ).toEqual([])
  })
})
