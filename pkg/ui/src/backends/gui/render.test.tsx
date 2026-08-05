// @vitest-environment jsdom

/**
 * The backend renders. Every component in the gui backend is mounted under the
 * real `GuiProvider` + the shipped config and asserted by its `data-slot` marker.
 *
 * This exists because a build, a typecheck and a pack all pass on a component
 * that throws on first paint — the flip was verified by all three and none of
 * them mounted anything.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Gallery } from '../../gallery'
import { Button, Input } from './index'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

const slots = (markup: string) =>
  [...markup.matchAll(/data-slot="([^"]+)"/g)].map((m) => m[1])

describe('gui backend renders', () => {
  // The surface is `src/gallery.tsx` — the same list `scripts/gen-css.mjs`
  // renders to generate the stylesheet and the consumer test renders in a
  // browser. A second copy of "every component" here would drift from it, and a
  // component styled by one list and missed by the other is the whole bug.
  it('mounts the whole surface and emits its slot markers', () => {
    const markup = html(<Gallery />)

    // Portalled panels (dialog/popover/menu/select content) do not appear in
    // static markup — they mount into a portal host at runtime. What is asserted
    // here is everything that renders in place.
    const seen = new Set(slots(markup))
    for (const slot of [
      'aspect-ratio',
      'badge',
      'button',
      'card',
      'command-group',
      'command-input',
      'command-item',
      'command-list',
      'input',
      'scroll-area',
      'scroll-area-viewport',
      'tabs',
      'tabs-list',
      'tabs-trigger',
      'textarea',
    ])
      expect(seen, slot).toContain(slot)
  })

  it('styles a Button and never leaks a style prop as an HTML attribute', () => {
    const markup = html(
      <Button variant="outline" size="lg">
        go
      </Button>,
    )
    expect(markup).toContain('data-variant="outline"')
    // gui compiles style props to classes; anything below means the frame is an
    // HOC and the styles went out as invalid attributes instead.
    for (const leak of ['backgroundcolor=', 'bordertopcolor=', 'hoverstyle=', 'font-size='])
      expect(markup, leak).not.toContain(leak)
  })

  it('styles a Button-as-link instead of dumping style props on the anchor', () => {
    const markup = html(
      <Button asChild="web" variant="outline" size="lg">
        <a href="/x">link</a>
      </Button>,
    )
    const anchor = markup.match(/<a [^>]*>/)?.[0] ?? ''
    // The anchor IS the button: same tag as the child, carrying the compiled
    // classes and the slot markers. Not a <button> wrapping an <a>.
    expect(anchor).toContain('href="/x"')
    expect(anchor).toContain('data-slot="button"')
    expect(anchor).toContain('is_Button')
    expect(markup).not.toMatch(/<button[\s\S]*<a /)
    for (const leak of ['backgroundcolor=', 'bordertopcolor=', 'hoverstyle=', 'height="40px"'])
      expect(markup, leak).not.toContain(leak)
  })

  // The trap that made the Switch a 36x29 box for as long as it existed: gui's
  // `size` variants return { height, minHeight, width }, so a wrapper that sets
  // `height` and not `minHeight` overrides two of the three, and min-height —
  // which always beats height — silently keeps the variant's floor. Nothing
  // fails; the control is simply the wrong size, and on a pill that also clamps
  // the radius until it stops being a pill.
  //
  // Scoped to the controls whose geometry IS the contract. A floor is not itself
  // a smell — Textarea writes `minH={64}` on purpose, because rows are its floor
  // and not a fixed size — so a surface-wide version of this cries wolf. These
  // are the ones where a floor can only be an accident.
  it('never lets a size floor outrank a fixed control\'s height', () => {
    const FIXED = ['switch', 'switch-thumb', 'checkbox']
    const markup = html(<Gallery />)
    const offenders: string[] = []
    let checked = 0

    for (const [tag] of markup.matchAll(/<[a-z]+\s[^>]*>/g)) {
      const slot = tag.match(/data-slot="([^"]+)"/)?.[1]
      if (!slot || !FIXED.includes(slot)) continue
      checked++
      const list = (tag.match(/class="([^"]*)"/)?.[1] ?? '').split(/\s+/)
      const h = list.find((c) => /^_height-\d+px$/.test(c))
      const mh = list.find((c) => /^_minH-\d+px$/.test(c))
      if (!h || !mh) continue
      const [height, floor] = [h, mh].map((c) => Number(c.match(/\d+/)![0]))
      if (floor > height) offenders.push(`${slot}: height ${height}px, floor ${floor}px`)
    }

    // A guard that matched nothing passes for the wrong reason, which is the
    // same shape of silence it exists to catch.
    expect(checked, 'the guard saw none of the controls it claims to cover')
      .toBeGreaterThanOrEqual(FIXED.length)
    expect(offenders, offenders.join('\n')).toHaveLength(0)
  })

  it('gives a web Button a 44px touch target it cannot get from hitSlop', () => {
    const markup = html(<Button size="sm">go</Button>)
    // 32px tall + 6px each side. `hitSlop` is dropped on web, so this attribute
    // is the only thing that can lift the target — theme.css has the rule.
    expect(markup).toContain('data-touch-y="6"')
    expect(markup).not.toContain('hitslop')
  })
})

describe('Input’s reveal', () => {
  const eye = (markup: string) => /aria-label="(Show|Hide) password"/.test(markup)

  it('draws the eye on a masked field, and only on a masked one', () => {
    expect(eye(html(<Input type="password" value="s" readOnly />))).toBe(true)
    expect(eye(html(<Input secureTextEntry value="s" readOnly />))).toBe(true)
    expect(eye(html(<Input value="s" readOnly />))).toBe(false)
  })

  it('yields the control when the caller owns it', () => {
    // `SecretInput` and every locally-masked field own their own reveal. Two
    // controls over one boolean is a field with two states that disagree: press
    // ours and the caller's icon still reads "show", press theirs and ours does,
    // and neither can say which one masked the field.
    expect(eye(html(<Input type="password" value="s" readOnly reveal={false} />))).toBe(false)
  })

  it('still masks the value when the eye is suppressed', () => {
    // The regression this locks: reading `reveal` as "show the value" rather
    // than "show the control" would unmask every field that suppressed the icon.
    const markup = html(<Input type="password" value="s" readOnly reveal={false} />)
    expect(markup).toContain('type="password"')
  })
})
