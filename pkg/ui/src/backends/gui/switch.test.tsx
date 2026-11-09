// @vitest-environment jsdom

/**
 * The Switch's geometry and its state affordance, asserted on the compiled
 * markup. Both defects this covers were invisible to a build, a typecheck and a
 * pack — the component rendered, it just rendered the wrong shape in one colour.
 *
 * Imports `./switch` directly rather than the backend barrel: the barrel pulls
 * the whole surface in, and a test for one component should not fail because a
 * different one's dependency moved.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Switch } from './switch'
import { Density } from './density'

const html = (node: React.ReactNode, theme: 'dark' | 'light' = 'dark') =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme={theme}>
      {node}
    </GuiProvider>,
  )

/** The frame is the element carrying the switch slot; the thumb carries its own. */
const frame = (markup: string) => markup.match(/<button[^>]*data-slot="switch"[^>]*>/)?.[0] ?? ''
const thumb = (markup: string) =>
  markup.match(/<div[^>]*data-slot="switch-thumb"[^>]*>/)?.[0] ?? ''

/** The compiled class for one style property, e.g. cls(el, 'bg') -> '_bg-color3'. */
const cls = (el: string, prop: string) =>
  (el.match(/class="([^"]*)"/)?.[1] ?? '').split(/\s+/).find((c) => c.startsWith(`_${prop}-`)) ?? ''

describe('Switch', () => {
  // gui's `size` variant returns { height, minHeight, width }, so setting only
  // `height` left its 29px floor in place — and min-height beats height. Every
  // switch in every app rendered 36×29, which at that ratio clamps a 1000px
  // radius to 10px: a rounded rectangle, not a pill, with the thumb adrift.
  it('is a 20px pill, and gui\'s size floor does not overrule its height', () => {
    const el = frame(html(<Switch checked={false} />))

    expect(cls(el, 'height')).toBe('_height-20px')
    expect(cls(el, 'minH')).toBe('_minH-20px')
    expect(el).not.toContain('_minH-29px')
  })

  // The whole point of a switch is that you can see which way it is set. gui's
  // default checked treatment is `$backgroundActive`, which in this theme
  // resolves to the value the unchecked track already has — so on and off were
  // pixel-identical apart from the thumb's 14px of travel. Asserting the classes
  // DIFFER rather than naming one keeps this honest if the palette moves.
  it('says on and off in colour, not only in the thumb\'s position', () => {
    const on = html(<Switch checked />)
    const off = html(<Switch checked={false} />)

    expect(cls(frame(on), 'bg')).not.toBe('')
    expect(cls(frame(on), 'bg')).not.toBe(cls(frame(off), 'bg'))
    expect(cls(thumb(on), 'bg')).not.toBe(cls(thumb(off), 'bg'))
  })

  // The one that matters, and the one whose absence let an invisible thumb ship
  // in 8.0.57-8.0.59. gui wraps the thumb in a sub-theme that INVERTS the ramp,
  // so naming the same token on both sides is what guarantees they contrast —
  // `$color3` is the dark track and the light thumb, `$color12` the light track
  // and the dark thumb. Choosing the thumb's token independently is choosing a
  // colour whose resolved value nothing here can see, which is how both states
  // came out painted onto their own background.
  it('paints the thumb with its track\'s token, so the sub-theme inverts it', () => {
    for (const checked of [true, false]) {
      const markup = html(<Switch checked={checked} />)
      expect(cls(thumb(markup), 'bg'), `checked=${checked}`).toBe(cls(frame(markup), 'bg'))
    }
  })

  // The checked thumb must REPLACE its colour, not add a second class that races
  // the first. `background` in activeStyle compiles to `_background-…` beside the
  // base `_bg-…`, so which one paints is decided by stylesheet order — a bug that
  // looks fine in one build and wrong in the next. Exactly one background class.
  it('resolves the thumb to a single background class in both states', () => {
    for (const checked of [true, false]) {
      const el = thumb(html(<Switch checked={checked} />))
      const bgs = (el.match(/class="([^"]*)"/)?.[1] ?? '')
        .split(/\s+/)
        .filter((c) => /^_(bg|background)-/.test(c))
      expect(bgs, `checked=${checked}: ${bgs.join(' ')}`).toHaveLength(1)
    }
  })

  // A disabled control that looks live invites a click that does nothing, and
  // this page had one sitting beside eight enabled ones.
  it('looks disabled when it is disabled', () => {
    const on = frame(html(<Switch checked={false} />))
    const off = frame(html(<Switch checked={false} disabled />))

    expect(off).toContain('disabled')
    expect(cls(off, 'o')).not.toBe(cls(on, 'o'))
  })

  // hitSlop is dropped on web, so this attribute is the only thing that can lift
  // a 20px control to the 44px floor. theme.css carries the matching rule.
  it('reaches the 44px touch floor without growing the pill', () => {
    const markup = html(<Switch checked={false} />)

    expect(frame(markup)).toContain('data-touch-y="12"')
    expect(markup).not.toContain('hitslop')
  })
})

describe('Switch sizes', () => {
  it.each([
    ['md', 32, 20, 16],
    ['sm', 24, 16, 12],
  ] as const)('%s: a %ix%i pill with a %ipx thumb, no edge, 2px in', (size, w, h, t) => {
    const markup = html(<Switch size={size} aria-label={size} />)
    const el = frame(markup)
    expect(cls(el, 'width')).toBe(`_width-${w}px`)
    expect(cls(el, 'height')).toBe(`_height-${h}px`)
    expect(cls(el, 'minH')).toBe(`_minH-${h}px`)
    expect(el).not.toMatch(/_btw-1px/)
    expect(cls(el, 'pt')).toBe('_pt-2px')
    expect(cls(thumb(markup), 'width')).toBe(`_width-${t}px`)
  })

  it('the record sizes keep the inverting thumb: it names its track’s token', () => {
    for (const checked of [false, true]) {
      const markup = html(<Switch size="sm" checked={checked} aria-label="x" />)
      expect(cls(thumb(markup), 'bg')).toBe(cls(frame(markup), 'bg'))
    }
  })

  it('regular stays 36 wide; compact makes a size-less switch md', () => {
    expect(cls(frame(html(<Switch aria-label="x" />)), 'width')).toBe('_width-36px')
    const compact = frame(
      html(
        <Density value="compact">
          <Switch aria-label="x" />
        </Density>,
      ),
    )
    expect(compact).toContain('data-size="md"')
    expect(cls(compact, 'width')).toBe('_width-32px')
  })
})

/*
 * hanzoai/ui#300. An audit read a BLUE on-state for the Cookie Preferences
 * switches out of a minified bundle. The bundle does carry blue: gui's theme
 * table ships `light_blue_Switch`, `dark_blue_SwitchThumb` and the other hues
 * beside the neutral pair. A switch paints from those only under a chromatic
 * `<Theme>`, though, and measured on hanzo.ai, hanzo.bot and hanzo.team at
 * 8.30.x it does not: on is #0a0a0a under a white thumb in light, #e5e5e5 under
 * a #0a0a0a thumb in dark, and nothing in the sheet computes to a hue.
 *
 * The tests above ask whether the states DIFFER and whether the thumb names its
 * track's token. These ask what each state PAINTS, in both root themes: the
 * rungs the compiled classes name, resolved through the sub-themes the browser
 * resolves them through. So a token, a palette or a theme that drifts toward a
 * hue fails here, by part, state and theme.
 */

type Scheme = 'dark' | 'light'

const THEMES = config.themes as unknown as Record<string, Record<string, unknown>>

/**
 * What a part reads for `key`: the first theme in its chain that states it. gui
 * wraps each value in a Variable (`{ val }`), and a component sub-theme that does
 * not state a key inherits it, through the cascade, from the theme it sits in.
 */
const read = (chain: string[], key: string): string => {
  for (const name of chain) {
    const v = THEMES[name]?.[key]
    const raw = typeof v === 'object' && v !== null && 'val' in v ? (v as { val: unknown }).val : v
    if (typeof raw === 'string') return raw
  }
  throw new Error(`no theme in ${chain.join(' > ')} states ${key}`)
}

/** gui names the frame `Switch` and the thumb `SwitchThumb`; each activates that sub-theme. */
const FRAME = (s: Scheme) => [`${s}_Switch`, s]
const THUMB = (s: Scheme) => [`${s}_SwitchThumb`, `${s}_Switch`, s]

/**
 * A colour as [r, g, b, a]. A re-based rung is `var(--name, LITERAL)`, and the
 * literal is what a host with no design sheet paints: the floor. A saturated
 * `hsl` is refused rather than approximated, because a hue is the defect.
 */
const rgba = (colour: string): [number, number, number, number] => {
  const ref = colour.match(/^var\(\s*--[\w-]+\s*,\s*(.+)\)$/s)
  if (ref) return rgba(ref[1].trim())
  const hex = colour.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1]
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1]
  }
  const hsl = colour.match(/^hsla?\(\s*[\d.]+\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)$/)
  if (hsl) {
    if (Number(hsl[1]) !== 0) throw new Error(`${colour} is a hue, not a grey`)
    const v = Math.round((Number(hsl[2]) / 100) * 255)
    return [v, v, v, hsl[3] === undefined ? 1 : Number(hsl[3])]
  }
  const parts = colour.replace(/^rgba?\(|\)$/g, '').split(/[\s,/]+/).filter(Boolean).map(Number)
  if (parts.length < 3 || parts.some(Number.isNaN)) throw new Error(`cannot read colour ${colour}`)
  return [parts[0], parts[1], parts[2], parts[3] ?? 1]
}

const grey = (colour: string) => {
  const [r, g, b] = rgba(colour)
  return r === g && g === b
}

/** `top` painted over an opaque `ground`: what the eye gets. */
const over = (top: string, ground: string): string => {
  const [r, g, b, a] = rgba(top)
  const [gr, gg, gb] = rgba(ground)
  const mix = (t: number, u: number) => Math.round(t * a + u * (1 - a))
  return `rgb(${mix(r, gr)} ${mix(g, gg)} ${mix(b, gb)})`
}

/** WCAG 2.x contrast ratio. */
const contrast = (a: string, b: string): number => {
  const lum = (colour: string) => {
    const [r, g, bl] = rgba(colour)
    const chan = (v: number) => (v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4)
    return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(bl)
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** The rung a compiled class names: `_bg-color12` -> `color12`. */
const rung = (el: string, prop: string) => cls(el, prop).slice(prop.length + 2)

/** What one state paints, resolved: the track, its edge, and the thumb. */
const paint = (s: Scheme, checked: boolean, disabled = false) => {
  const markup = html(<Switch checked={checked} disabled={disabled} aria-label="x" />, s)
  const names = { track: rung(frame(markup), 'bg'), edge: rung(frame(markup), 'btc'), thumb: rung(thumb(markup), 'bg') }
  for (const [part, name] of Object.entries(names))
    expect(name, `${s}, checked=${checked}: the ${part} names a theme rung`).toMatch(/^\w+$/)
  return {
    track: read(FRAME(s), names.track),
    edge: read(FRAME(s), names.edge),
    thumb: read(THUMB(s), names.thumb),
  }
}

describe('Switch colour, light and dark (#300)', () => {
  it.each(['light', 'dark'] as const)('%s: on, off and disabled paint greys, no hue (blue or otherwise)', (s) => {
    for (const checked of [true, false])
      for (const disabled of [false, true])
        for (const [part, colour] of Object.entries(paint(s, checked, disabled)))
          expect({ part, checked, disabled, colour, grey: grey(colour) }).toEqual({ part, checked, disabled, colour, grey: true })
  })

  // WCAG 1.4.11: what tells the state must clear 3:1 against what is next to it.
  // The ground is the theme's `background`, which Consent's panel and a page both
  // stand on. Off's track is translucent, so it is painted over that ground first.
  it.each(['light', 'dark'] as const)('%s: each state reads at 3:1, thumb on track, on against off and the ground', (s) => {
    const ground = read([s], 'background')
    const on = paint(s, true)
    const off = paint(s, false)
    const track = { on: over(on.track, ground), off: over(off.track, ground) }

    expect(contrast(over(on.thumb, track.on), track.on), 'on: the thumb against its track').toBeGreaterThanOrEqual(3)
    expect(contrast(over(off.thumb, track.off), track.off), 'off: the thumb against its track').toBeGreaterThanOrEqual(3)
    expect(contrast(track.on, track.off), 'on against off').toBeGreaterThanOrEqual(3)
    expect(contrast(track.on, ground), 'on against the ground').toBeGreaterThanOrEqual(3)
  })

  // gui's Switch frame focuses with `outlineColor: '$outlineColor'`, and this
  // frame names no ring of its own, so the theme's ring is the one drawn: design's
  // `--ring`, the same mark every other control here wears.
  it.each(['light', 'dark'] as const)('%s: the focus ring is design’s, a grey, and clears 3:1 on the ground', (s) => {
    expect(frame(html(<Switch checked aria-label="x" />, s))).toMatch(/_outlineColor-0focus-visible-/)
    const ring = read(FRAME(s), 'outlineColor')
    const ground = read([s], 'background')

    expect(ring).toMatch(/^var\(--ring,/)
    expect(grey(over(ring, ground)), ring).toBe(true)
    expect(contrast(over(ring, ground), ground)).toBeGreaterThanOrEqual(3)
  })
})
