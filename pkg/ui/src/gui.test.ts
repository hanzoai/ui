/**
 * The gui packages are ONE train, and this asserts the fact that makes
 * `gui-env.d.ts` work.
 *
 * That file augments `GuiCustomConfig` inside `@hanzogui/web` and
 * `@hanzogui/core`, and a `declare module` binds to a resolved FILE rather than
 * to a name. So the copy this package augments has to be the copy `@hanzo/gui`
 * itself reads. Move `@hanzo/gui` alone and it is not: pnpm nests the new
 * `@hanzogui/web` under gui while this package keeps the old one, the
 * augmentation lands on a file nothing consults, `GuiCustomConfig` stays empty,
 * and every shorthand collapses at once — 462 errors on `bg`, `px`, `items`,
 * `rounded`, not one of which names a version or a package.
 *
 * Read the INSTALL, not the pins: a pin is what was asked for, a resolved path
 * is what arrived, and pnpm keeps a satisfied lockfile entry rather than
 * re-resolving. The two disagree exactly when it matters.
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const UI = dirname(dirname(fileURLToPath(import.meta.url)))

/** Resolve a package as code inside `from` would. `package.json` is the one
 *  specifier every package exports, so this asks about the package rather than
 *  about a condition map. */
const at = (from: string) => (name: string) =>
  createRequire(join(from, 'package.json')).resolve(`${name}/package.json`)

const ours = at(UI)
const gui = at(dirname(ours('@hanzo/gui')))

const version = (path: string): string => JSON.parse(readFileSync(path, 'utf8')).version

/** What `gui-env.d.ts` augments. Both carry `GuiCustomConfig`, and a component's
 *  props read whichever copy its own import chain reaches. */
const AUGMENTED = ['@hanzogui/web', '@hanzogui/core'] as const

describe('one copy of the gui config carrier', () => {
  for (const name of AUGMENTED) {
    it(`${name} is the file @hanzo/gui reads`, () => {
      expect(ours(name)).toBe(gui(name))
    })
  }

  it('every gui package this one names installs at one version', () => {
    const pkg = JSON.parse(readFileSync(join(UI, 'package.json'), 'utf8'))
    const train = Object.keys(pkg.devDependencies as Record<string, string>).filter(
      (name) => name === '@hanzo/gui' || name.startsWith('@hanzogui/')
    )
    expect(train.length).toBeGreaterThan(1)
    const installed = Object.fromEntries(train.map((name) => [name, version(ours(name))]))
    expect(new Set(Object.values(installed)).size, JSON.stringify(installed, null, 2)).toBe(1)
  })
})
