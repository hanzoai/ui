import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { gui, ui, version } from './index'

// Paths are read against the package root, which is vitest's root here — the
// suite checks the package as a consumer meets it, so it names dist and
// package.json the way a consumer would rather than reaching for its own file.
const at = (path: string) => join(process.cwd(), path)
const read = (path: string) => readFileSync(at(path), 'utf8')
const pkg = JSON.parse(read('package.json'))

/** Every string leaf of the exports map — the files the package promises. */
const targets = (node: unknown): string[] =>
  typeof node === 'string'
    ? [node]
    : node && typeof node === 'object'
      ? Object.values(node).flatMap(targets)
      : []

// A static `import 'x'`, `import … from 'x'` or `export … from 'x'`. Whitespace
// after the keyword is what excludes `import('x')`, which is the whole point.
const STATIC = /\b(?:import|export)\s+(?:[^;]*?\sfrom\s+)?['"]@hanzo\/(?:ui|gui)['"]/

describe('the exports map', () => {
  const promised = targets(pkg.exports)

  it('promises something', () => {
    expect(promised.length).toBeGreaterThan(0)
  })

  it.each(promised)('%s is in dist', (target) => {
    expect(target.startsWith('./dist/')).toBe(true)
    expect(existsSync(at(target))).toBe(true)
  })
})

describe('the root entry', () => {
  it.each(['src/index.ts', 'dist/index.js'])('%s reaches neither library statically', (file) => {
    expect(read(file)).not.toMatch(STATIC)
  })

  it('states the published version', () => {
    expect(version).toBe(pkg.version)
  })

  it('holds loaders, not libraries', () => {
    expect(ui).toBeTypeOf('function')
    expect(gui).toBeTypeOf('function')
  })
})

// These load the published libraries themselves, not a stand-in. What makes
// that possible in node is the react-native-web substitution in
// devDependencies — see tsconfig.json, where the same swap is explained and
// undone for types.
//
// A loader loads a whole component library — @hanzo/ui's module graph takes
// about a minute in node, which is a minute the 5s default does not have. The
// budget belongs to these two and not to the seventeen assertions above.
const LOAD = 180_000

describe('the loaders', () => {
  it(
    'ui() resolves @hanzo/ui',
    async () => {
      expect((await ui()).Button).toBeTypeOf('function')
    },
    LOAD,
  )

  it(
    'gui() resolves @hanzo/gui',
    async () => {
      expect((await gui()).styled).toBeTypeOf('function')
    },
    LOAD,
  )
})
