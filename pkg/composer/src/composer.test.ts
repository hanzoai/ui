import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { COMPOSER, KNOBS, ROUND } from './index'

const css = readFileSync(new URL('./composer.css', import.meta.url), 'utf8')

/** What `:root` publishes — the defaults a surface overrides. */
const defaults = new Set(
  Array.from((css.match(/:root \{[^}]*\}/)?.[0] ?? '').matchAll(/(--[a-z-]+)\s*:/g), (m) => m[1]),
)
/** Everything read through `var()`, wherever it is set. */
const read = new Set(Array.from(css.matchAll(/var\(\s*(--[a-z-]+)/g), (m) => m[1]))

/**
 * Names the stylesheet owns that are NOT tunable: the animated conic angle
 * (a `@property`, whose whole job is to be interpolated) and the control's
 * resolved box (computed from a knob, one rule down).
 */
const INTERNAL = ['--hz-angle', '--hz-round-size']

describe('the knob list is the stylesheet', () => {
  // Two files, one vocabulary. A knob the CSS reads but index.ts omits is
  // untunable from a settings panel; one index.ts names but the CSS never
  // touches is a control wired to nothing. Fails in both directions.
  it('is exactly the composer properties the stylesheet touches', () => {
    const touched = [...new Set([...defaults, ...read])]
      .filter((n) => n.startsWith('--hz-') && !INTERNAL.includes(n))
      .sort()
    expect(touched).toEqual([...KNOBS].sort())
  })

  it('publishes a default for every knob but the contrast edge', () => {
    // `--hz-composer-edge` has no resting value on purpose: it only applies
    // under prefers-contrast, where it carries its own fallback.
    const missing = [...KNOBS].filter((k) => !defaults.has(k))
    expect(missing).toEqual(['--hz-composer-edge'])
  })

  it('gives every foreign token a fallback', () => {
    // A token from @hanzo/design must degrade when the sheet loads alone.
    for (const name of ['--density', '--text-base', '--hz-composer-edge']) {
      const uses = css.match(new RegExp(`var\\(\\s*${name}[^)]*\\)`, 'g')) ?? []
      expect(uses.length, name).toBeGreaterThan(0)
      for (const u of uses) expect(u, `${name} needs a fallback`).toContain(',')
    }
  })
})

describe('the ring is one measurement', () => {
  // The host's padding IS the band's width. Two literals here is how a band
  // comes to clip or to show a hairline of panel behind it.
  it('sizes the host and the band from the same property', () => {
    const host = css.match(/\.hz-composer \{[^}]*\}/)?.[0] ?? ''
    const band = css.match(/\.hz-composer::before \{[^}]*\}/)?.[0] ?? ''
    expect(host).toContain('padding: var(--hz-composer-band)')
    expect(band).toContain('padding: var(--hz-composer-band)')
  })

  it('derives the halo corner rather than restating it', () => {
    const halo = css.match(/\.hz-composer::after \{[^}]*\}/)?.[0] ?? ''
    // Concentric: a box larger on every side needs a wider corner.
    expect(halo).toContain('calc(var(--hz-composer-radius) + var(--hz-composer-halo))')
  })

  it('lifts on focus as well as hover', () => {
    expect(css).toContain('.hz-composer:focus-within::before')
    expect(css).toContain('.hz-composer:focus-within::after')
  })

  it('leaves the field no edge of its own', () => {
    // One edge per control. @hanzo/design gives a field a surface and a border
    // because a field on a page needs to show where it is; inside the ring that
    // border draws a square inside a pill.
    const field = css.match(/\.hz-composer :is\(input, textarea\) \{[^}]*\}/)?.[0] ?? ''
    expect(field).toContain('border: 0')
    expect(field).toContain('background: transparent')
  })
})

describe('accessibility', () => {
  it.each([
    'prefers-reduced-motion: reduce',
    'prefers-reduced-transparency: reduce',
    'prefers-contrast: more',
    'forced-colors: active',
  ])('answers %s', (q) => {
    expect(css).toContain(`@media (${q})`)
  })

  it('drops both decorative layers under forced colours', () => {
    // A masked gradient survives a forced palette as a grey smear; only a
    // system-coloured border is guaranteed visible.
    const block = css.slice(css.indexOf('@media (forced-colors: active)'))
    expect(block).toContain('display: none')
    expect(block).toContain('solid CanvasText')
  })

  it('floors the round controls at the AA target', () => {
    // Density is a multiplier; without a floor a compact preference walks a
    // 30px control under WCAG 2.5.8's 24px.
    expect(css).toContain('max(24px, calc(var(--hz-composer-control) * var(--density, 1)))')
  })

  it('beats the library radius rule it has to outrank', () => {
    // @hanzo/ui writes [data-variant][data-size]{border-radius:…!important} at
    // (0,3,0). This selector is (0,3,1) and must carry !important to reach it.
    const round = css.match(/html:root \.hz-composer :is\(button, a\)\.hz-round \{[^}]*\}/)?.[0]
    expect(round).toBeTruthy()
    expect(round).toContain('border-radius: 9999px !important')
  })
})

describe('the class names are the API', () => {
  it.each([COMPOSER, ROUND])('%s is styled', (name) => {
    expect(css).toContain(`.${name}`)
  })
})
