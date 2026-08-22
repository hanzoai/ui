// @vitest-environment jsdom

/**
 * The ToggleGroup, asserted on the COMPILED MARKUP and on a real click.
 *
 * @hanzo/gui drops a prop it does not recognise silently — no throw, no type
 * error, just an element that never got the style. `variant` and `size` are
 * exactly that shape of prop (neither exists on a gui toggle; `size` exists and
 * means something ELSE — a square), so every claim here is a class or an
 * attribute that actually reached the DOM node.
 *
 * Imports `./toggle-group` directly rather than the backend barrel: a test for
 * one component should not fail because a different one's dependency moved.
 */
import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { ToggleGroup, ToggleGroupItem } from './toggle-group'

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
 * '_bg-ink'. Pseudo-state classes share the prefix (`_bg-0hover-hover`),
 * and matching one of those by accident is how an assertion ends up comparing
 * two hover styles and reporting that the resting fills differ.
 */
const PSEUDO = /^_[a-zA-Z]+-0(hover|press|focus|active|disabled)/
const cls = (el: string, prop: string) =>
  (el.match(/class="([^"]*)"/)?.[1] ?? '')
    .split(/\s+/)
    .find((c) => c.startsWith(`_${prop}-`) && !PSEUDO.test(c)) ?? ''

/** The label a segment renders, as its own compiled tag. */
const labels = (markup: string) => tags(markup, 'sizable-text')

const items = (type: 'single' | 'multiple', value: never) =>
  html(
    <ToggleGroup type={type} value={value}>
      <ToggleGroupItem value="a">A</ToggleGroupItem>
      <ToggleGroupItem value="b">B</ToggleGroupItem>
    </ToggleGroup>,
  )

describe('ToggleGroup', () => {
  // The defect this file exists to fix. Radix gives an exclusive group
  // role="radiogroup" and each segment role="radio" + aria-checked; gui keeps
  // role="group" and DELETES aria-pressed for single without putting anything
  // back, so the selected segment announced as an unlabelled button with no
  // state. Nothing about that is visible in a screenshot or a build.
  it('announces an exclusive group as radios, which gui does not', () => {
    const markup = items('single', 'a' as never)

    expect(tag(markup, 'toggle-group')).toContain('role="radiogroup"')
    const [a, b] = tags(markup, 'toggle-group-item')
    expect(a).toContain('role="radio"')
    expect(a).toContain('aria-checked="true"')
    expect(b).toContain('aria-checked="false"')
    // An exclusive choice is not a pressed button — both cannot be true at once.
    expect(markup).not.toContain('aria-pressed')
  })

  it('announces a multi-select group as a toolbar of pressed buttons', () => {
    const markup = items('multiple', ['b'] as never)

    expect(tag(markup, 'toggle-group')).toContain('role="toolbar"')
    const [a, b] = tags(markup, 'toggle-group-item')
    expect(a).toContain('aria-pressed="false"')
    expect(b).toContain('aria-pressed="true"')
    expect(markup).not.toContain('role="radio"')
  })

  // gui consumes `orientation` for the roving-focus axis and never forwards it,
  // and its frame is a plain View — which STACKS. Radix's was a <div> the call
  // site made a row. Every horizontal segmented control came out a column.
  it('lays out on the axis it announces', () => {
    const row = tag(html(<ToggleGroup type="single" />), 'toggle-group')
    expect(cls(row, 'fd')).toBe('_fd-row')

    const column = tag(html(<ToggleGroup type="single" orientation="vertical" />), 'toggle-group')
    expect(cls(column, 'fd')).toBe('_fd-column')
  })

  // shadcn's rule, and both desktop call sites depend on a different half of it:
  // one sets variant on the GROUP and size on each ITEM, the other sets size on
  // items only. A group value wins; otherwise the item decides.
  it('resolves variant and size the shadcn way, and both reach the DOM', () => {
    const fromGroup = tags(
      html(
        <ToggleGroup type="single" variant="outline" size="lg">
          <ToggleGroupItem value="a" size="sm">
            A
          </ToggleGroupItem>
        </ToggleGroup>,
      ),
      'toggle-group-item',
    )[0]
    expect(fromGroup).toContain('data-variant="outline"')
    expect(fromGroup).toContain('data-size="lg"')
    // outline draws its own edge over a transparent well…
    expect(cls(fromGroup, 'bg')).toBe('_bg-transparent')
    expect(cls(fromGroup, 'btc')).toBe('_btc-borderColor')
    // …and `lg` is a HEIGHT, not gui's square-from-a-token.
    expect(cls(fromGroup, 'height')).toBe('_height-40px')

    const fromItem = tags(
      html(
        <ToggleGroup type="single">
          <ToggleGroupItem value="a" size="sm">
            A
          </ToggleGroupItem>
        </ToggleGroup>,
      ),
      'toggle-group-item',
    )[0]
    expect(fromItem).toContain('data-size="sm"')
    expect(cls(fromItem, 'height')).toBe('_height-32px')
    expect(cls(fromItem, 'bg')).toBe('_bg-hover')
  })

  // A state expressed as one step of grey is legible beside its neighbours and
  // invisible on its own — a screenshot, a narrow column and a low-vision reader
  // all lose it. Fill AND label move, and asserting they DIFFER rather than
  // naming a token keeps this honest if the palette moves.
  it('says on and off in the fill and in the label', () => {
    const markup = items('single', 'a' as never)
    const [on, off] = tags(markup, 'toggle-group-item')
    const [onLabel, offLabel] = labels(markup)

    expect(cls(on, 'bg')).not.toBe('')
    expect(cls(on, 'bg')).not.toBe(cls(off, 'bg'))
    expect(cls(onLabel, 'col')).not.toBe('')
    expect(cls(onLabel, 'col')).not.toBe(cls(offLabel, 'col'))
  })

  // gui merges `activeStyle` into hover and focus as well as rest, which is the
  // whole reason the on-state is expressed that way instead of as a conditional
  // prop: a selected segment that loses its fill under the pointer reads as
  // deselected for as long as the pointer is on it.
  it('keeps the selected fill under the pointer and on focus', () => {
    const [on] = tags(items('single', 'a' as never), 'toggle-group-item')
    const classes = on.match(/class="([^"]*)"/)?.[1] ?? ''

    expect(classes).toContain('_bg-0hover-rim')
    expect(classes).toContain('_bg-0focus-rim')
  })

  it('lifts a 32px segment to the 44px touch floor', () => {
    const markup = html(
      <ToggleGroup type="single" size="sm">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    )
    // hitSlop is dropped on web, so this attribute is the only thing that can
    // lift the target without growing the control. theme.css carries the rule.
    expect(tag(markup, 'toggle-group-item')).toContain('data-touch-y="6"')
    expect(markup.toLowerCase()).not.toContain('hitslop')
  })

  it('looks and behaves disabled, whether the group or the item says so', () => {
    const markup = html(
      <ToggleGroup type="single" disabled>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    )
    const item = tag(markup, 'toggle-group-item')

    expect(item).toContain('disabled=""')
    expect(item).toContain('aria-disabled="true"')
    // Out of the tab order, so a keyboard user is not parked on a dead control.
    expect(item).toContain('tabindex="-1"')
    expect(cls(item, 'o')).toBe('_o-0--5')

    const fromItem = tag(
      html(
        <ToggleGroup type="single">
          <ToggleGroupItem value="a" disabled>
            A
          </ToggleGroupItem>
        </ToggleGroup>,
      ),
      'toggle-group-item',
    )
    expect(fromItem).toContain('disabled=""')
    expect(cls(fromItem, 'o')).toBe('_o-0--5')
  })

  // The mirror this file keeps for aria has to BE the value, not a copy that
  // drifts: gui is handed value + onValueChange from it, so a click has to come
  // back out of the callback AND move the aria state.
  it('reports the value the user picked, exclusively', () => {
    const picked: string[] = []
    const host = mount(
      <ToggleGroup type="single" defaultValue="a" onValueChange={(v: string) => picked.push(v)}>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    )
    const segments = host.querySelectorAll<HTMLButtonElement>('[data-slot="toggle-group-item"]')

    act(() => segments[1].click())

    expect(picked).toEqual(['b'])
    expect(segments[1].getAttribute('aria-checked')).toBe('true')
    expect(segments[1].dataset.state).toBe('on')
    expect(segments[0].getAttribute('aria-checked')).toBe('false')
  })

  it('accumulates values when it is a multi-select', () => {
    const picked: string[][] = []
    const host = mount(
      <ToggleGroup
        type="multiple"
        defaultValue={['a']}
        onValueChange={(v: string[]) => picked.push(v)}
      >
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    )
    const segments = host.querySelectorAll<HTMLButtonElement>('[data-slot="toggle-group-item"]')

    act(() => segments[1].click())

    expect(picked.at(-1)).toEqual(['a', 'b'])
    expect(segments[0].getAttribute('aria-pressed')).toBe('true')
    expect(segments[1].getAttribute('aria-pressed')).toBe('true')
  })
})
