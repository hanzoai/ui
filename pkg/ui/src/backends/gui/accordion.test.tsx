// @vitest-environment jsdom

/**
 * The Accordion's a11y contract, asserted on the compiled markup and on a live
 * DOM — never on the text, because @hanzo/gui DROPS a prop it does not
 * recognise with no throw and no type error, so "the label rendered" proves
 * only that a string reached a Text host.
 *
 * Imports `./accordion` directly rather than the backend barrel: the barrel
 * pulls the whole surface in, and a test for one component should not fail
 * because a different one's dependency moved.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

/** A live tree — the only place a keypress or a click means anything. */
const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  return {
    host,
    triggers: () => [...host.querySelectorAll<HTMLElement>('[data-slot="accordion-trigger"]')],
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

/** The compiled class for one style property, e.g. cls(el, 'transform'). */
const cls = (el: string, prop: string) =>
  (el.match(/class="([^"]*)"/)?.[1] ?? '').split(/\s+/).find((c) => c.startsWith(`_${prop}-`)) ?? ''

const three = (extra?: React.ComponentProps<typeof Accordion>) => (
  <Accordion type="single" defaultValue="b" collapsible {...(extra as object)}>
    {['a', 'b', 'c'].map((v) => (
      <AccordionItem key={v} value={v}>
        <AccordionTrigger>row {v}</AccordionTrigger>
        <AccordionContent>body {v}</AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
)

describe('Accordion', () => {
  it('gives every row a real button that says what it controls', () => {
    const markup = html(three())
    const trigger = tag(markup, 'accordion-trigger')

    expect(tag(markup, 'accordion')).not.toBe('')
    expect(tag(markup, 'accordion-item')).not.toBe('')
    expect(trigger.startsWith('<button')).toBe(true)
    expect(trigger).toMatch(/aria-expanded="(true|false)"/)
    expect(trigger).toMatch(/aria-controls="[^"]+"/)
    expect(trigger).toContain('data-state=')
    // gui renders a BARE <button>, and a bare button inside a form submits it —
    // an accordion in a settings form posted the form on every disclosure.
    expect(trigger).toContain('type="button"')
  })

  // The open row's panel is what a screen reader jumps to, and it is only
  // reachable because the region names itself after the button that opened it.
  it('names the open panel after its trigger', () => {
    const markup = html(three())
    const content = tag(markup, 'accordion-content')
    const labelledBy = content.match(/aria-labelledby="([^"]+)"/)?.[1]

    expect(content).toContain('role="region"')
    expect(labelledBy).toBeTruthy()
    // The id belongs to a trigger, and to the one whose row is open.
    const owner = markup.match(new RegExp(`<button[^>]*id="${labelledBy}"[^>]*>`))?.[0] ?? ''
    expect(owner).toContain('data-slot="accordion-trigger"')
    expect(owner).toContain('aria-expanded="true"')
  })

  it('reports expanded state per row, not for the accordion as a whole', () => {
    const expanded = [...html(three()).matchAll(/aria-expanded="(true|false)"/g)].map((m) => m[1])

    expect(expanded).toEqual(['false', 'true', 'false'])
  })

  // gui's Accordion.Header is an <h1> at size $10. Three items shipped three
  // competing document titles, and a heading-list reader saw N level-1s.
  it('is an h3 by default and never an h1', () => {
    const header = tag(html(three()), 'accordion-header')

    expect(header.startsWith('<h3')).toBe(true)
    // gui's Heading carries role="heading", which is only VALID with a level.
    expect(header).toContain('aria-level="3"')
    expect(html(three())).not.toContain('<h1')
    // …and it is structure, not type: gui's heading scale ($8) would otherwise
    // publish a 32px font down to any element child of the trigger.
    expect(cls(header, 'fs')).toBe('_fs-f-size-3')
  })

  it('places the row in the caller’s outline when asked', () => {
    const markup = renderToStaticMarkup(
      wrap(
        <Accordion type="single" collapsible>
          <AccordionItem value="a">
            <AccordionTrigger headingLevel={2}>row</AccordionTrigger>
            <AccordionContent>body</AccordionContent>
          </AccordionItem>
        </Accordion>,
      ),
    )
    const header = tag(markup, 'accordion-header')

    expect(header.startsWith('<h2')).toBe(true)
    expect(header).toContain('aria-level="2"')
  })

  // The chevron is the only thing on the row that says which way it is set, and
  // it can only know that from the trigger's function child. Asserting the
  // compiled transform classes DIFFER keeps this honest if the angle changes.
  it('rotates the chevron with its row, and drops it for hideArrow', () => {
    const markup = html(three())
    const chevrons = [...markup.matchAll(/<[a-z0-9]+[^>]*data-slot="accordion-chevron"[^>]*>/g)].map(
      (m) => m[0],
    )

    expect(chevrons).toHaveLength(3)
    // `_tr-` is gui's compiled `transform`; the suffix hashes the angle.
    expect(cls(chevrons[1], 'tr')).not.toBe('')
    expect(cls(chevrons[1], 'tr')).not.toBe(cls(chevrons[0], 'tr'))

    const bare = renderToStaticMarkup(
      wrap(
        <Accordion type="single" collapsible>
          <AccordionItem value="a">
            <AccordionTrigger hideArrow>row</AccordionTrigger>
            <AccordionContent>body</AccordionContent>
          </AccordionItem>
        </Accordion>,
      ),
    )
    expect(bare).not.toContain('accordion-chevron')
  })

  it('says a disabled row is disabled to the pointer and to the reader', () => {
    const markup = renderToStaticMarkup(
      wrap(
        <Accordion type="single" collapsible>
          <AccordionItem value="a" disabled>
            <AccordionTrigger>row</AccordionTrigger>
            <AccordionContent>body</AccordionContent>
          </AccordionItem>
        </Accordion>,
      ),
    )
    const trigger = tag(markup, 'accordion-trigger')

    expect(trigger).toContain('disabled=""')
    expect(trigger).toContain('data-disabled=""')
  })

  it('opens the row that was pressed', () => {
    const onValueChange = vi.fn()
    const view = mount(three({ onValueChange } as never))

    act(() => {
      view.triggers()[2].click()
    })

    expect(onValueChange).toHaveBeenCalledWith('c')
    view.cleanup()
  })

  // Radix roves with the arrow keys and so does gui — but only if the root's
  // keydown handler actually reached the DOM, which is the whole reason to
  // assert it rather than trust the import.
  it('roves focus with the arrow keys and wraps at the ends', () => {
    const view = mount(three())
    const [first, second, third] = view.triggers()

    act(() => first.focus())
    act(() => {
      first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    })
    expect(document.activeElement).toBe(second)

    act(() => {
      second.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
    })
    expect(document.activeElement).toBe(third)

    act(() => {
      third.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    })
    expect(document.activeElement).toBe(first)

    view.cleanup()
  })
})
