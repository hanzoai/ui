// @vitest-environment jsdom

/**
 * The RadioGroup, asserted on the COMPILED MARKUP and on a real click.
 *
 * @hanzo/gui drops a prop it does not recognise silently — no throw, no type
 * error, just an element that never got the style. So a test that renders the
 * component and checks its text proves only that the file parses. Every claim
 * here is a class or an attribute that actually reached the DOM node.
 *
 * Imports `./radio-group` directly rather than the backend barrel: a test for
 * one component should not fail because a different one's dependency moved.
 */
import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { RadioGroup, RadioGroupItem } from './radio-group'
import { Density } from './density'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

/** Mounts for real, so a callback can be asserted by clicking the actual button. */
const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  act(() => createRoot(host).render(wrap(node)))
  return host
}

/** Every open tag carrying `data-slot="<slot>"`, in document order. */
const tags = (markup: string, slot: string): string[] => [
  ...(markup.match(new RegExp(`<[a-z]+[^>]*data-slot="${slot}"[^>]*>`, 'g')) ?? []),
]

const tag = (markup: string, slot: string) => tags(markup, slot)[0] ?? ''

/**
 * The compiled class for one style property AT REST, e.g. cls(el, 'bg') ->
 * '_bg-color12'. Pseudo-state classes share the prefix (`_bg-0hover-color3`),
 * and matching one of those by accident is how an assertion ends up comparing
 * two hover styles and reporting that the resting fills differ.
 */
const PSEUDO = /^_[a-zA-Z]+-0(hover|press|focus|active|disabled)/
const cls = (el: string, prop: string) =>
  (el.match(/class="([^"]*)"/)?.[1] ?? '')
    .split(/\s+/)
    .find((c) => c.startsWith(`_${prop}-`) && !PSEUDO.test(c)) ?? ''

const group = (
  <RadioGroup value="b">
    <RadioGroupItem value="a" id="ra" />
    <RadioGroupItem value="b" id="rb" />
  </RadioGroup>
)

describe('RadioGroup', () => {
  // The reason to use a radio group instead of three buttons. gui supplies all
  // of this, so what is asserted is that flattening the compound parts did not
  // shadow any of it — `role` and `aria-checked` arrive on the frame BEFORE this
  // file's props, and one careless spread would overwrite them.
  it('announces a radio group of radios, each a real form control', () => {
    const markup = html(group)

    expect(tag(markup, 'radio-group')).toContain('role="radiogroup"')
    const items = tags(markup, 'radio-group-item')
    expect(items).toHaveLength(2)
    for (const item of items) {
      expect(item).toContain('role="radio"')
      // Without type="button" every item submits the form it sits in.
      expect(item).toContain('type="button"')
    }
    // The id is what a <Label htmlFor> points at, and both call sites in the
    // desktop app pass one.
    expect(items[0]).toContain('id="ra"')
    expect(items[1]).toContain('id="rb"')
  })

  it('says which item is checked, in aria and in the dot', () => {
    const markup = html(group)
    const [a, b] = tags(markup, 'radio-group-item')

    expect(a).toContain('aria-checked="false"')
    expect(a).toContain('data-state="unchecked"')
    expect(b).toContain('aria-checked="true"')
    expect(b).toContain('data-state="checked"')

    // The dot mounts only while checked — presence IS the state.
    const dots = tags(markup, 'radio-group-indicator')
    expect(dots).toHaveLength(1)
    // …and it has to be visible against the well it sits in. Asserting the two
    // DIFFER rather than naming a token keeps this honest if the palette moves;
    // the Switch shipped a thumb painted its own background because its test
    // only asked whether the two STATES differed from each other.
    expect(cls(dots[0], 'bg')).not.toBe('')
    expect(cls(dots[0], 'bg')).not.toBe(cls(b, 'bg'))
  })

  // gui consumes `orientation` for aria and for the roving-focus axis and never
  // forwards it, so its `orientation` variant never runs: the group announced
  // itself a row and rendered a COLUMN. Both halves are asserted because fixing
  // the layout by dropping the prop would break the announcement instead.
  it('lays out on the axis it announces', () => {
    const row = tag(html(<RadioGroup orientation="horizontal" />), 'radio-group')
    expect(row).toContain('aria-orientation="horizontal"')
    expect(cls(row, 'fd')).toBe('_fd-row')

    const column = tag(html(<RadioGroup />), 'radio-group')
    expect(column).toContain('aria-orientation="vertical"')
    expect(cls(column, 'fd')).toBe('_fd-column')
  })

  // gui's `size` variant would set this from a token (`$true` * scaleSize); the
  // Switch shipped 36×29 because a variant's floor outlived the explicit prop.
  it('is a 16px circle that reaches the 44px touch floor', () => {
    const markup = html(group)
    const item = tag(markup, 'radio-group-item')

    expect(cls(item, 'width')).toBe('_width-16px')
    expect(cls(item, 'height')).toBe('_height-16px')
    expect(cls(item, 'btlr')).toBe('_btlr-1000px')
    // hitSlop is dropped on web, so these attributes are the only thing that can
    // lift a 16px control to the floor. theme.css carries the matching rule.
    expect(item).toContain('data-touch-x="14"')
    expect(item).toContain('data-touch-y="14"')
    expect(markup.toLowerCase()).not.toContain('hitslop')
  })

  // gui's own disabled variant kills pointer events without dimming: a dead
  // control that looks live invites a click that does nothing.
  it('looks disabled when it is disabled', () => {
    // Both in one group: an item outside a RadioGroup has no roving-focus
    // context and throws, which is itself the contract these parts have.
    const [live, dead] = tags(
      html(
        <RadioGroup>
          <RadioGroupItem value="a" />
          <RadioGroupItem value="b" disabled />
        </RadioGroup>,
      ),
      'radio-group-item',
    )

    expect(dead).toContain('disabled=""')
    expect(dead).toContain('aria-disabled="true"')
    expect(cls(dead, 'o')).not.toBe(cls(live, 'o'))
  })

  it('reports the value the user picked', () => {
    const picked: string[] = []
    const host = mount(
      <RadioGroup defaultValue="a" onValueChange={(v: string) => picked.push(v)}>
        <RadioGroupItem value="a" />
        <RadioGroupItem value="b" />
      </RadioGroup>,
    )
    const items = host.querySelectorAll<HTMLButtonElement>('[data-slot="radio-group-item"]')

    act(() => items[1].click())

    expect(picked).toEqual(['b'])
    expect(items[1].getAttribute('aria-checked')).toBe('true')
    expect(items[0].getAttribute('aria-checked')).toBe('false')
  })
})

describe('RadioGroupItem, the record look', () => {
  it('naming no size keeps the plain 16px ring and its ink dot', () => {
    const markup = html(group)
    expect(tag(markup, 'radio-group-item')).not.toContain('data-size')
    expect(cls(tag(markup, 'radio-group-indicator'), 'bg')).toBe('_bg-ink')
  })

  it.each([
    ['sm', 16],
    ['md', 18],
  ] as const)('%s: a %ipx secondary-ink ring at 0.95, filled with the accent when checked', (size, px) => {
    const markup = html(
      <RadioGroup value="a">
        <RadioGroupItem size={size} value="a" aria-label="a" />
      </RadioGroup>,
    )
    const item = tag(markup, 'radio-group-item')
    expect(cls(item, 'width')).toBe(`_width-${px}px`)
    expect(cls(item, 'btc')).toBe('_btc-aside')
    expect(item).toMatch(/_tr-scale0--95/)
    // The 4px hover halo, on the hover rung.
    expect(item).toMatch(/_bxsh-0hover-/)
    const fill = tag(markup, 'radio-group-indicator')
    expect(cls(fill, 'bg')).toBe('_bg-primary')
    expect(markup).toMatch(/_bg-primary-fo/)
  })

  it('a disabled option sits at 32% and takes no hover', () => {
    const item = tag(
      html(
        <RadioGroup>
          <RadioGroupItem size="sm" value="a" disabled aria-label="a" />
        </RadioGroup>,
      ),
      'radio-group-item',
    )
    expect(cls(item, 'o')).toBe('_o-0--32')
    expect(item).not.toMatch(/_bxsh-0hover/)
  })

  it('a compact density draws it with no size given', () => {
    const markup = html(
      <Density value="compact">
        <RadioGroup value="a">
          <RadioGroupItem value="a" aria-label="a" />
        </RadioGroup>
      </Density>,
    )
    expect(tag(markup, 'radio-group-item')).toContain('data-size="sm"')
  })

  it('still selects on a click, as the plain item does', () => {
    let picked = ''
    const host = mount(
      <RadioGroup onValueChange={(v) => (picked = v)}>
        <RadioGroupItem size="sm" value="a" aria-label="a" />
        <RadioGroupItem size="sm" value="b" aria-label="b" />
      </RadioGroup>,
    )
    const b = host.querySelectorAll<HTMLButtonElement>('[data-slot="radio-group-item"]')[1]
    act(() => b.click())
    expect(picked).toBe('b')
    host.remove()
  })
})
