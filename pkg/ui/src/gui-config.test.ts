/**
 * The numbered ramp is not the token layer, and two rungs used to say so.
 *
 * `$color1..$color12` comes from upstream `@hanzogui/themes` — a generic
 * monotonic scale. @hanzo/design is where this system's colour decisions are
 * made. Where the two overlap the ramp must defer, and on two rungs it did the
 * opposite: it shipped a SOLID edge under a token layer whose borders are alpha
 * on purpose, and PURE WHITE labels under a foreground that is `#fafafa` on
 * purpose. Every component in this package reads both by name, so the ramp's
 * opinion reached the product and design's did not.
 *
 * These tests read @hanzo/design's OWN published stylesheet — not a copy of it,
 * not a number typed here — so if design moves a value and gui-config does not,
 * this fails by rung and by theme.
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

import { config } from './gui-config'

const require = createRequire(import.meta.url)
const design = readFileSync(require.resolve('@hanzo/design/styles.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

/**
 * What design publishes for a token in a theme, resolved through one level of
 * indirection: design writes its dark `--border` as `var(--white-10)`, and the
 * question this file asks is what a browser would PAINT, not how design spells
 * it. Dark is `:root`, light is the `.light` block — the same two scopes
 * glass.test.ts reads, for the same reason.
 */
const token = (name: string, theme: 'dark' | 'light'): string => {
  const hits = [...design.matchAll(new RegExp(`--${name}:\\s*([^;]+);`, 'g'))]
    .map((m) => {
      const open = design.lastIndexOf('{', m.index)
      return {
        scope: design.slice(Math.max(design.lastIndexOf('}', open), 0), open).replace(/[{}]/g, '').trim(),
        value: m[1].replace(/\s+/g, ' ').trim(),
      }
    })
    .filter((d) => (theme === 'light' ? d.scope.includes('.light') : d.scope === ':root'))
  if (!hits.length) throw new Error(`@hanzo/design publishes no ${theme} --${name}`)
  const value = hits[hits.length - 1].value
  const indirect = value.match(/^var\(--([\w-]+)\)$/)
  return indirect ? token(indirect[1], theme) : value
}

/**
 * A theme value as authored. `createGui` wraps every one in a Variable
 * (`{ isVar, key, name, val }`) and interns the payload under `val` — reading
 * the wrapper itself stringifies to `[object Object]`, which compares equal to
 * every other rung and would make this whole file pass on any input.
 */
const themed = (theme: 'dark' | 'light', key: string) => {
  const v = (config.themes as Record<string, Record<string, unknown>>)[theme][key] as
    | string
    | { val?: unknown }
  const raw = typeof v === 'object' && v !== null && 'val' in v ? v.val : v
  expect(typeof raw, `${theme}.${key} is not a string value`).toBe('string')
  return raw as string
}

describe('the two rungs design already decided read the token', () => {
  it.each(['dark', 'light'] as const)('%s: the edge is design’s alpha hairline, not a solid grey', (theme) => {
    // The anti-pattern design's colors.css spends a paragraph refusing: a solid
    // hex edge stops being a lighter LINE the moment it lands on a lifted
    // surface and becomes an unrelated grey rectangle. `hsla(0, 0%, 14%, 1)`
    // was that, on Button, Input, Card, Select, Dialog, Popover, Tooltip,
    // Switch, Checkbox and DropdownMenu at once.
    const edge = token('border', theme)
    expect(edge).toMatch(/^rgb\(.*\/\s*\.10\)$/)
    expect(themed(theme, 'borderColor')).toBe(`var(--border, ${edge})`)
    expect(themed(theme, 'color4')).toBe(`var(--border, ${edge})`)
  })

  it.each(['dark', 'light'] as const)('%s: the loud label is design’s foreground, not pure white', (theme) => {
    // `$color12` is Button default/primary, every Badge, and the `accent`
    // recipe. Pure white halates on near-black — design says so and picks
    // #fafafa; the ramp reintroduced exactly what the token was authored to
    // avoid, on the one loud control a page is allowed.
    const label = token('foreground', theme)
    expect(label.toLowerCase()).not.toBe('#ffffff')
    expect(themed(theme, 'color12')).toBe(`var(--foreground, ${label})`)
  })

  it('the two themes do not collapse onto one literal', () => {
    // A fallback is only worth having if it is the RIGHT one in the scope that
    // reaches it, and the scope that reaches it is a nested `<Theme
    // name="light">` — a span, where design's `:root` still says dark. Copying
    // the dark column into both is how a white pill gets a white label.
    expect(themed('dark', 'borderColor')).not.toBe(themed('light', 'borderColor'))
    expect(themed('dark', 'color12')).not.toBe(themed('light', 'color12'))
  })

  it('the rest of the ramp is left alone — this is a re-base, not a fork', () => {
    // Every other rung is a grey in a scale of greys and design has no opinion
    // about it. Restating them here would be a second palette, which is the
    // thing the re-base exists to stop.
    for (const theme of ['dark', 'light'] as const)
      for (const rung of ['color1', 'color2', 'color3', 'color5', 'color6', 'color11'])
        expect([theme, rung, themed(theme, rung)]).toEqual([theme, rung, expect.stringMatching(/^hsla?\(/)])
  })
})
