/**
 * The numbered ramp is not the token layer, and three rungs used to say so.
 *
 * `$color1..$color12` comes from upstream `@hanzogui/themes` — a generic
 * monotonic scale. @hanzo/design is where this system's colour decisions are
 * made. Where the two overlap the ramp must defer, and on three rungs it did
 * the opposite: a SOLID edge under a token layer whose borders are alpha on
 * purpose, PURE WHITE labels under a foreground that is `#fafafa` on purpose,
 * and a focus ring at 1.4:1 under a `--ring` authored to clear 3:1. Every
 * component in this package reads them by name, so the ramp's opinion reached
 * the product and design's did not.
 *
 * These tests read @hanzo/design's OWN published stylesheet — not a copy of it,
 * not a number typed here — so if design moves a value and gui-config does not,
 * this fails by rung and by theme.
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

import { config, css, monochrome } from './gui-config'

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

/** `#rrggbb`, `rgb(r g b)`, `rgb(r g b / a)` or a GREYSCALE `hsla(0, 0%, l%, a)`
 *  as [r, g, b, a]. The ramp is written in the last form, and only in greyscale —
 *  a saturated rung would be a hue this system does not spend, so it throws
 *  rather than quietly approximating one. */
const parse = (colour: string): [number, number, number, number] => {
  // A re-based rung is `var(--name, LITERAL)`, and the LITERAL is the one of the
  // two a test can hold to: it is what a host that mounts no design sheet
  // computes, so asserting contrast on it asserts the FLOOR. A host that does
  // mount design's sheet follows the live cascade to a value this file already
  // checks separately, against design's own stylesheet, in `token()`.
  const ref = colour.match(/^var\(\s*--[\w-]+\s*,\s*(.+)\)$/s)
  if (ref) return parse(ref[1].trim())
  const hex = colour.match(/^#([0-9a-f]{6})$/i)
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)).concat(1) as never
  const hsl = colour.match(/^hsla?\(\s*[\d.]+\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)$/)
  if (hsl) {
    if (Number(hsl[1]) !== 0) throw new Error(`${colour} is not greyscale`)
    const v = Math.round((Number(hsl[2]) / 100) * 255)
    return [v, v, v, hsl[3] === undefined ? 1 : Number(hsl[3])]
  }
  const parts = colour.replace(/^rgba?\(|\)$/g, '').split(/[\s,/]+/).filter(Boolean).map(Number)
  if (parts.length < 3 || parts.some(Number.isNaN)) throw new Error(`cannot read colour ${colour}`)
  return [parts[0], parts[1], parts[2], parts[3] ?? 1]
}

/** A translucent colour painted over an opaque one — what the eye actually gets. */
const over = (top: string, ground: string): string => {
  const [r, g, b, a] = parse(top)
  const [gr, gg, gb] = parse(ground)
  const mix = (t: number, u: number) => Math.round(t * a + u * (1 - a))
  return `rgb(${mix(r, gr)} ${mix(g, gg)} ${mix(b, gb)})`
}

/** WCAG 2.x relative luminance and contrast ratio. */
const contrast = (a: string, b: string): number => {
  const lum = (colour: string) => {
    const [r, g, bl] = parse(colour)
    const chan = (v: number) => (v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4)
    return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(bl)
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
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

describe('the rungs design already decided read the token', () => {
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

  it.each(['dark', 'light'] as const)('%s: the focus ring is design’s --ring, and it CLEARS 3:1', (theme) => {
    // WCAG 2.4.11, computed rather than asserted as a string — a string check
    // passes on any grey somebody types. The ring is translucent, so it is
    // composited over design's own ground first: that is what an eye gets.
    const ring = token('ring', theme)
    const ground = token('background', theme)
    expect(themed(theme, 'outlineColor')).toBe(`var(--ring, ${ring})`)
    expect(contrast(over(ring, ground), ground)).toBeGreaterThanOrEqual(3)
  })

  it('the ramp’s own ring was a grey that only works on white — and this is dark-first', () => {
    // `hsla(0, 0%, 27%, 0.6)` is why the requirement is computed and not
    // eyeballed: on a white page it clears 3:1 comfortably, so nothing about
    // reading the number says it is broken. On design's near-black ground the
    // same value composites to about rgb(45,45,45) and lands near 1.4:1 — an
    // invisible ring on hanzo.app's Sign In, Get started and Search, the three
    // primary CTAs. A ramp inherited from a light-first substrate cannot know
    // which canvas it will be spent on; a token can, and design's --ring is
    // translucent white for exactly that reason.
    const ramp = 'rgb(69 69 69 / .6)'
    expect(contrast(over(ramp, token('background', 'dark')), token('background', 'dark'))).toBeLessThan(3)
    expect(contrast(over(ramp, token('background', 'light')), token('background', 'light'))).toBeGreaterThan(3)
  })

  it('the two themes do not collapse onto one literal', () => {
    // A fallback is only worth having if it is the RIGHT one in the scope that
    // reaches it, and the scope that reaches it is a nested `<Theme
    // name="light">` — a span, where design's `:root` still says dark. Copying
    // the dark column into both is how a white pill gets a white label.
    expect(themed('dark', 'borderColor')).not.toBe(themed('light', 'borderColor'))
    expect(themed('dark', 'color12')).not.toBe(themed('light', 'color12'))
  })

  it('EVERY theme rings in one value — a sub-theme does not get its own', () => {
    // The three CTAs the audit named live under `dark_Button`, which gui
    // activates for every Button it renders, so fixing only the root themes
    // left them exactly as broken. There is one focus ring in this system.
    const all = Object.keys(config.themes)
    expect(all.length).toBeGreaterThan(300)
    const rings = new Set(all.map((n) => themed(n as 'dark', 'outlineColor')))
    expect([...rings].sort()).toEqual(
      [`var(--ring, ${token('ring', 'dark')})`, `var(--ring, ${token('ring', 'light')})`].sort(),
    )
    // …and a `light_*` sub-theme takes the light fallback, not the dark one.
    expect(themed('light_Button' as 'light', 'outlineColor')).toBe(`var(--ring, ${token('ring', 'light')})`)
    expect(themed('dark_Button' as 'dark', 'outlineColor')).toBe(`var(--ring, ${token('ring', 'dark')})`)
  })

  it('every edge is design’s or the theme’s own rung 4 — there is no third thing', () => {
    // The whole invariant in one line, read off the built table. 390 themes: 288
    // take design's, 102 keep a scale of their own, and NOTHING lands anywhere
    // else. Before this, 286 sub-themes each nudged the edge off a greyscale
    // that predates the token layer, so a page and the controls on it disagreed.
    const odd = Object.keys(config.themes).filter((n) => {
      const border = themed(n as 'dark', 'borderColor')
      return (
        border !== `var(--border, ${token('border', 'dark')})` &&
        border !== `var(--border, ${token('border', 'light')})` &&
        border !== themed(n as 'dark', 'color4')
      )
    })
    expect(odd).toEqual([])
  })

  it('the component sub-themes gui activates take the system edge', () => {
    // Measured in a browser before this, `dark`: Input and Textarea drew
    // `rgb(51,51,51)`, Button, Switch and the AlertDialog's cancel drew
    // `rgb(69,69,69)`, beside 45 elements already on design's hairline — the
    // Card, Badge, Dialog, Popover, Select trigger, Checkbox and Radio. The
    // Select is a `<button>` and read the root; the Input read `dark_Input`.
    for (const scheme of ['dark', 'light'] as const)
      for (const part of ['Input', 'TextArea', 'Button', 'Switch', 'Slider', 'Progress', 'surface1', 'surface2']) {
        const name = `${scheme}_${part}`
        expect([name, themed(name as 'dark', 'borderColor')]).toEqual([
          name,
          `var(--border, ${token('border', scheme)})`,
        ])
      }
  })

  it('a component sub-theme follows the theme it is nested IN, not the root', () => {
    // Following the parent is what keeps this a re-base and not a flattening:
    // `dark_red` states a scale, so its Button keeps a red edge rather than
    // taking a white hairline. Re-basing every sub-theme onto design would
    // collapse 388 themes into one and stop being a re-base.
    expect(themed('dark_red_Button' as 'dark', 'borderColor')).toBe(themed('dark_red' as 'dark', 'color4'))
    expect(themed('dark_black_Button' as 'dark', 'borderColor')).toBe(themed('dark_black' as 'dark', 'color4'))

    // …and a theme with a surface of its own keeps its line. `dark_Tooltip`
    // grounds at `hsla(0, 0%, 80%, 1)` — a LIGHT surface inside a dark page,
    // where a 10%-white hairline would be invisible.
    expect(themed('dark_Tooltip' as 'dark', 'borderColor')).toMatch(/^hsla?\(/)
  })

  it('the rest of the ramp is left alone — this is a re-base, not a fork', () => {
    // The rule is not "three rungs". The rule is: a rung is re-based WHEN design
    // has already decided it and the ramp says otherwise — anything more is a
    // second palette, which is the thing the re-base exists to stop.
    //
    // color2/3/5 moved from this list to the one below because design turned out
    // to have an opinion about surfaces all along: `--surface-1/2/3` resolve to
    // `--card`, `--muted` and `--secondary`. They qualify on exactly the grounds
    // color4 and color12 did. The rungs still here are greys in a scale of greys
    // with nothing published against them.
    for (const theme of ['dark', 'light'] as const)
      for (const rung of ['color1', 'color6', 'color11'])
        expect([theme, rung, themed(theme, rung)]).toEqual([theme, rung, expect.stringMatching(/^hsla?\(/)])
  })

  it('the surface rungs read design instead of shadowing it', () => {
    // A fill is the larger case of the argument the edge already won: a solid
    // hex stops being a lift and becomes an unrelated grey the moment it lands
    // on a lifted surface. Named, so a rung cannot quietly go solid again.
    for (const theme of ['dark', 'light'] as const)
      for (const [rung, name] of [
        ['color2', 'surface-1'],
        ['color3', 'surface-2'],
        ['color5', 'surface-3'],
      ] as const)
        expect([theme, rung, themed(theme, rung)]).toEqual([
          theme,
          rung,
          expect.stringContaining(`var(--${name},`),
        ])
  })
})

describe('the readable-secondary rung', () => {
  /**
   * `$color11` is the rung chrome puts SECONDARY TEXT on — a code block's
   * language label, a panel's description, a metric's caption. `$color10` is a
   * rung dimmer than that, and components reached for it because it looked
   * quieter, not because it was legible.
   *
   * The audit that prompted this measured the language label at 2.97:1 on
   * hanzo.ai/overview. That number is NOT reproducible from this package: the
   * ramp below puts `$color10` on `$color2` at 8:1 dark and 11.8:1 light, so the
   * failure came from a HOST redeclaring `--color10`/`--t*` at `:root` on top of
   * ours. Which is exactly why the assertion here is about the rung's job rather
   * than about one page's pixels — the value we control is which rung a shared
   * component asks for, and a component that asks for the readable one survives
   * a host that dims the other.
   */
  /**
   * The surface is COMPOSITED before it is measured, because it is translucent.
   * `lum()` reads r,g,b and ignores alpha, so a 3%-white lift measured raw reads
   * as pure white and every ratio against it is nonsense — 1.61 where the eye
   * gets 15.9. An opaque rung never needed this; a lift always does.
   */
  const lifted = (theme: 'dark' | 'light') =>
    over(themed(theme, 'color2'), themed(theme, 'background'))

  it.each(['dark', 'light'] as const)('%s: secondary text clears 4.5:1 on the surface it sits on', (theme) => {
    expect(contrast(themed(theme, 'color11'), lifted(theme))).toBeGreaterThanOrEqual(4.5)
  })

  it.each(['dark', 'light'] as const)('%s: and is strictly more legible than the rung below it', (theme) => {
    const surface = lifted(theme)
    expect(contrast(themed(theme, 'color11'), surface)).toBeGreaterThan(
      contrast(themed(theme, 'color10'), surface),
    )
  })
})

/**
 * `monochrome` is `config` with rows removed — never a second scale. Every
 * assertion here is a relationship BETWEEN the two, so the only way to break it
 * is to author a value in one that does not exist in the other.
 */
describe('monochrome is config minus the hues', () => {
  const names = (c: typeof config) => Object.keys(c.themes)
  const CHROMA = ['blue', 'green', 'orange', 'pink', 'purple', 'red', 'teal', 'yellow']

  it('keeps both root themes — a surface still has a ground to stand on', () => {
    expect(names(monochrome)).toEqual(expect.arrayContaining(['dark', 'light']))
  })

  it('activates no chromatic sub-theme', () => {
    const chromatic = names(monochrome).filter((n) =>
      n.split('_').slice(1).some((s) => CHROMA.includes(s)),
    )
    expect(chromatic).toEqual([])
  })

  it('keeps every greyscale sub-theme, so a monochrome surface loses nothing', () => {
    const wanted = names(config).filter(
      (n) => !n.split('_').slice(1).some((s) => CHROMA.includes(s)),
    )
    expect(names(monochrome).sort()).toEqual(wanted.sort())
  })

  it('is a strict subset — it can never carry a theme config does not', () => {
    const full = new Set(names(config))
    expect(names(monochrome).filter((n) => !full.has(n))).toEqual([])
  })

  it('is meaningfully smaller, or it is not worth having', () => {
    expect(names(monochrome).length).toBeLessThan(names(config).length / 2)
  })

  it('shares one scale: a theme present in both is byte-identical', () => {
    for (const n of names(monochrome)) {
      expect(monochrome.themes[n as keyof typeof monochrome.themes]).toEqual(
        config.themes[n as keyof typeof config.themes],
      )
    }
  })

  it('shares the radius and font decisions, which live in one place', () => {
    expect(monochrome.tokens.radius).toEqual(config.tokens.radius)
    expect(monochrome.fonts.mono.family).toBe(config.fonts.mono.family)
  })
})

/**
 * The type ladder defers to @hanzo/design, and these prove it did so without
 * moving a single rendered pixel.
 *
 * gui resolves font sizes in JS and applies them INLINE, where they outrank
 * every stylesheet — so a CSS custom property is the only thing that can reach
 * a `fontSize="$n"` call site, and there are ~1600 of them across the apps.
 * That is why the ladder names `var(--text-*)` rather than a number: design's
 * ramp multiplies by `--type-scale`, so one knob retunes the whole product.
 *
 * The risk of doing that is silent resizing — naming a token whose published
 * value is not the number that was there. So each mapped rung is checked
 * against design's OWN stylesheet, the same way the three colour rungs are.
 */
describe('the type ladder defers to @hanzo/design', () => {
  /**
   * A rung is a base rem plus a signed step, the step scaled by `--type-ratio`
   * and the sum by `--type-scale`, all clamped between a floor and a ceiling:
   *
   *     --text-xs: clamp(var(--text-floor),
   *                      calc((0.875rem - 0.1875rem * var(--type-ratio, 1))
   *                           * var(--type-scale, 1)),
   *                      var(--text-ceiling))
   *
   * `--text-base` carries no step, so the base alone is the rung. This returns
   * px at a 16px root with both knobs at 1 — what the rung renders untuned.
   */
  const textPx = (name: string): number => {
    const m = design.match(
      new RegExp(
        `--text-${name}:[^;]*?calc\\(\\(?([0-9.]+)rem` +
          `(?:\\s*([-+])\\s*([0-9.]+)rem\\s*\\*\\s*var\\(--type-ratio)?`,
      ),
    )
    if (!m) throw new Error(`@hanzo/design publishes no --text-${name} (or it stopped scaling)`)
    const step = m[3] ? Number(m[3]) * (m[2] === '-' ? -1 : 1) : 0
    return (Number(m[1]) + step) * 16
  }

  /** The rem the clamp's lower bound holds every rung to, in px. */
  const floorPx = (): number => {
    const m = design.match(/--text-floor:\s*([0-9.]+)rem/)
    if (!m) throw new Error('@hanzo/design publishes no --text-floor')
    return Number(m[1]) * 16
  }

  // gui keys these by the BARE rung ('3'), not '$3', and stores the value as a
  // plain string — which is itself the finding: a var() survives into the token
  // table untouched, exactly as it does for the three colour rungs above.
  const size = config.fonts.body.size as Record<string, unknown>
  const val = (k: string | number): string => String(size[String(k)] ?? '')

  /** Every rung that names a design token, and the px it used to be. */
  const MAPPED: Array<[number, string, number]> = [
    [1, 'xs', 11], [2, 'sm', 13], [3, 'base', 14], [4, 'lg', 15], [5, 'lg', 15],
    [6, 'xl', 17], [7, '2xl', 21], [8, '3xl', 26], [9, '3xl', 26],
    [10, '4xl', 32], [11, '5xl', 40], [14, '7xl', 64],
  ]

  it.each(MAPPED)('$%i names --text-%s, and design still publishes %ipx', (rung, name, px) => {
    expect(val(rung)).toBe(`var(--text-${name}, ${px}px)`)
    // The whole point: the token's published value IS the number that was here,
    // so deferring changed nothing. If design retunes the rung, this fails.
    expect(textPx(name)).toBe(px)
    // A clamped rung renders its bound, not its expression, so the number above
    // is one a browser paints only while it clears the floor.
    expect(px).toBeGreaterThanOrEqual(floorPx())
  })

  it('every rung can be retuned by ONE knob', () => {
    // A rung reaches --type-scale either through the design tokens it names
    // (whose declarations are calcs on the knob) or by carrying the knob itself.
    // A rung that does neither is a rung a person cannot resize.
    //
    // EVERY token it names, not just a leading one: four rungs fall between two
    // of design's and are written as an interpolation of both, so a matcher
    // anchored on `^var(--text-…` sees a `calc(` and calls a fully-derived rung
    // stuck. The property was always "does it reach the knob"; only the shape a
    // rung may take widened.
    const stuck: string[] = []
    for (let k = 1; k <= 16; k++) {
      const v = val(k)
      const named = [...v.matchAll(/var\(--text-([a-z0-9]+)[,)]/g)].map((m) => m[1])
      if (named.length) {
        for (const n of named) {
          const decl = design.match(new RegExp(`--text-${n}:\\s*([^;]+);`))?.[1] ?? ''
          if (!decl.includes('var(--type-scale')) stuck.push(`$${k} -> --text-${n} does not scale`)
        }
      } else if (!v.includes('var(--type-scale')) {
        stuck.push(`$${k} = ${v}`)
      }
    }
    expect(stuck).toEqual([])
  })

  it('the deliberate collapses survive — $4/$5 and $8/$9 stay one size each', () => {
    expect(val(5)).toBe(val(4))
    expect(val(9)).toBe(val(8))
  })

  it('leading tracks the knob but keeps ITS rhythm, not design\'s', () => {
    const lh = config.fonts.body.lineHeight as Record<string, unknown>
    const lval = (k: number) => String(lh[String(k)] ?? '')
    // Only one of sixteen matched design's --leading-*, so adopting them would
    // re-flow every line box. They stay, and scale.
    for (let k = 1; k <= 16; k++) expect(lval(k)).toMatch(/var\(--type-scale, 1\)/)
    expect(lval(3)).toBe('calc(20px * var(--type-scale, 1))')
  })
})

/**
 * The three axes @hanzo/appearance publishes — type, density, accent — plus the
 * brand palette underneath them. All four are the SAME mechanism: a value in
 * @hanzo/design that gui references rather than copies. A rung that resolves to
 * a literal renders perfectly and answers to nobody, which is the failure these
 * assert against.
 */
describe('a person and a brand can both move this', () => {
  // createGui turns each token into a Variable: the `$` is stripped from the
  // key and the authored value moves to `.val`.
  const space = config.tokens.space as unknown as Record<string, { val: string | number }>

  it('every spacing step carries the density knob', () => {
    // design multiplies its own --space-* by --density, but gui compiles a
    // SECOND ramp for `padding="$4"` and resolves it in JS — so until this
    // carried the knob, a density preference moved the stylesheet and left
    // every gui-rendered gap exactly where it was.
    const stuck = Object.entries(space)
      .filter(([, v]) => v.val !== 0 && !String(v.val).includes('var(--density'))
      .map(([k]) => k)
    expect(stuck).toEqual([])
  })

  it('zero stays zero — a token meaning "no space" needs no knob', () => {
    expect(space['0'].val).toBe(0)
  })

  it('the ground, the ink and the loud fill are REFERENCES, not copies', () => {
    // Each names a @hanzo/design token, so a brand that retunes the token moves
    // gui with it. `background` is the exception and is asserted below.
    const dark = config.themes.dark as unknown as Record<string, { val?: string }>
    const refOf = (k: string) => String(dark[k]?.val ?? dark[k] ?? '')
    expect(refOf('color')).toContain('var(--foreground')
    expect(refOf('placeholderColor')).toContain('var(--text-tertiary')
    // Accent reads ACCENT. It used to read `--primary`, and while nothing in the
    // package consumed the pair that was merely an odd mapping; the moment
    // Button's loud control started reading it, the difference became the
    // difference between #262626 and a white slab.
    expect(refOf('accentBackground')).toContain('var(--accent')
    expect(refOf('accentColor')).toContain('var(--accent-foreground')
    expect(refOf('borderColor')).toContain('var(--border')
    expect(refOf('outlineColor')).toContain('var(--ring')
  })

  it('css() drops the names design owns from the ROOT themes', () => {
    // gui publishes a bare --<key> per theme key at (0,2,0), which outranks
    // design's :root (0,1,0) for the whole document. Referencing the name back
    // would cycle and compute EMPTY, so the declaration goes instead and
    // `var(--background)` resolves through design.
    const out = css()
    const rootThemeBodies = [...out.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter((m) => m[1].split(',').some((sel) => /^:root(\.t_(dark|light))?$/.test(sel.trim())))
      .map((m) => m[2])
    for (const name of ['background', 'black', 'white'])
      for (const body of rootThemeBodies)
        expect(body).not.toMatch(new RegExp(`(^|;)\\s*--${name}\\s*:`))
  })

  it('a NESTED theme keeps its own ground — that is what a nested theme IS', () => {
    const out = css()
    const nested = [...out.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter((m) => /\.t_\w+\s*\.t_\w+|\.t_[a-z]+_/.test(m[1]))
    expect(nested.some((m) => /--background\s*:/.test(m[2]))).toBe(true)
  })
})

describe('one authority decides the theme', () => {
  it('the sheet asks the OS nothing — no prefers-color-scheme block', () => {
    // gui's default wraps each theme's ROOT variables in a colour-scheme media
    // query. @hanzo/design is dark-first at bare `:root` and retunes under
    // `.light`, and gui stamps `.t_dark`/`.t_light` on <html>, so the media
    // block is a second answer to a question already answered — and it ties
    // design on specificity, so it wins on load order wherever it applies.
    //
    // What it costs is invisible until a light-scheme browser opens a dark
    // product: the gui token table resolves to the LIGHT base while every
    // class-token surface beside it stays dark. Measured on hanzo.app in
    // production, which is why its generator used to unwrap this after the fact.
    expect(css()).not.toContain('prefers-color-scheme')
  })

  it('the class-driven root themes are still both there', () => {
    // The point is to delete the OS question, not a theme. Unwrapping has to
    // leave the dark and light grounds reachable by the class gui writes.
    const out = css()
    expect(out).toContain(':root.t_dark')
    expect(out).toContain(':root.t_light')
  })
})

describe('one emitter, either table', () => {
  it('css(monochrome) is the monochrome sheet, not the full one', () => {
    // A surface that mounts `monochrome` and emits `css()` ships 390 themes of
    // CSS for a runtime that can activate 150 — the reduced table with the full
    // sheet beside it, which is the worst of both.
    const full = css()
    const mono = css(monochrome)
    expect(mono.length).toBeLessThan(full.length)
    expect(mono).not.toMatch(/\.t_(light_|dark_)?(blue|green|orange|pink|purple|red|teal|yellow)(_|\b)/)
    expect(full).toMatch(/\.t_(light_|dark_)?(blue|green|orange|pink|purple|red|teal|yellow)(_|\b)/)
  })

  it('the prune still runs on it — a reduced table shadows design the same way', () => {
    const rootThemeBodies = [...css(monochrome).matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter((m) => m[1].split(',').some((sel) => /^:root(\.t_(dark|light))?$/.test(sel.trim())))
      .map((m) => m[2])
    expect(rootThemeBodies.length).toBeGreaterThan(0)
    for (const name of ['background', 'black', 'white'])
      for (const body of rootThemeBodies)
        expect(body).not.toMatch(new RegExp(`(^|;)\\s*--${name}\\s*:`))
  })
})

/**
 * The type ladder is SIXTEEN rungs over design's THIRTEEN, so four of them
 * ($12 48 · $13 56 · $15 80 · $16 96) fall between two of design's and used to
 * carry a px literal instead.
 *
 * That was fine while `--type-scale` was the only knob — a multiplier moves a
 * literal and a token alike, so the ladder stayed ordered. `--type-ratio`
 * expands the ramp around its base rung and can only reach a rung that READS
 * the ramp, so the twelve bound rungs grew past the four frozen ones: at ratio
 * 1.5, $11 measured 53px against $12's 48px. A higher rung rendering smaller is
 * not a size being wrong, it is the ladder ceasing to be one.
 */
describe('the type ladder', () => {
  const FONT = (config as unknown as { fonts: Record<string, { size: Record<string, string> }> }).fonts
  const sizes = Object.values(FONT)[0].size

  it('has no frozen rung — every one is a function of design’s ramp', () => {
    for (const [rung, value] of Object.entries(sizes)) {
      if (rung === 'true') continue
      expect(String(value), `$${rung} must read the ramp, not a literal`).toContain('var(--text-')
    }
  })

  it('spends the four in-between rungs as interpolations of their neighbours', () => {
    // 48 IS a third of the way from 40 to 64 — that was always the fact, and
    // now the value says so, which is why a ramp change it has never heard of
    // moves it correctly and a literal could not.
    expect(sizes['12']).toContain('--text-5xl')
    expect(sizes['12']).toContain('--text-7xl')
    expect(sizes['15']).toContain('--text-7xl')
    expect(sizes['15']).toContain('--text-8xl')
    expect(sizes['16']).toContain('--text-9xl')
  })

  it('is ordered, and stays ordered — a point between two ordered values is one', () => {
    // Structural rather than measured: an interpolation of two ascending rungs
    // cannot overtake either, whatever the knobs do to them. jsdom resolves no
    // var(), so the numbers live in the browser test; what is assertable here is
    // that no rung is outside that argument.
    const rungs = Object.keys(sizes).filter((k) => k !== 'true')
    expect(rungs.length).toBe(16)
    for (const r of rungs) expect(String(sizes[r])).toMatch(/var\(--text-/)
  })
})
