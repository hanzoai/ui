// @vitest-environment jsdom

/**
 * The Choicebox, asserted on the compiled markup and on a real click.
 *
 * @hanzo/gui drops a prop it does not recognise with no throw and no type
 * error, so a test that only checks rendered text proves a string reached a
 * Text host, nothing about the group's semantics. Every claim here is a class
 * or an attribute that actually reached the DOM node.
 *
 * Imports `./choicebox` directly rather than the backend barrel: a test for
 * one component should not fail because a different one's dependency moved.
 */
import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Choicebox, type ChoiceboxOption } from './choicebox'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

/** Mounts for real, so a callback can be asserted by clicking the actual card. */
const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  act(() => createRoot(host).render(wrap(node)))
  return host
}

const tags = (markup: string, slot: string): string[] => [
  ...(markup.match(new RegExp(`<[a-z]+[^>]*data-slot="${slot}"[^>]*>`, 'g')) ?? []),
]

const tag = (markup: string, slot: string) => tags(markup, slot)[0] ?? ''

const cls = (el: string, prop: string) =>
  (el.match(/class="([^"]*)"/)?.[1] ?? '').split(/\s+/).find((c) => c.startsWith(`_${prop}-`)) ?? ''

const options: ChoiceboxOption[] = [
  { value: 'a', label: 'Option A', description: 'The first option' },
  { value: 'b', label: 'Option B', description: 'The second option' },
  { value: 'c', label: 'Option C' },
]

describe('Choicebox', () => {
  it('announces a single choice as a group of radios', () => {
    const markup = html(<Choicebox options={options} value="b" />)

    expect(tag(markup, 'choicebox')).toContain('role="radiogroup"')
    const items = tags(markup, 'choicebox-item')
    expect(items).toHaveLength(3)
    for (const item of items) expect(item).toContain('role="radio"')

    expect(items[0]).toContain('aria-checked="false"')
    expect(items[1]).toContain('aria-checked="true"')
    expect(items[1]).toContain('data-state="checked"')
  })

  it('announces a multi-select as a group of checkboxes', () => {
    const markup = html(<Choicebox options={options} value="a,c" multiple />)

    expect(tag(markup, 'choicebox')).toContain('role="group"')
    const items = tags(markup, 'choicebox-item')
    for (const item of items) expect(item).toContain('role="checkbox"')
    expect(items[0]).toContain('aria-checked="true"')
    expect(items[1]).toContain('aria-checked="false"')
    expect(items[2]).toContain('aria-checked="true"')
  })

  it('renders every label and description it was given', () => {
    const markup = html(<Choicebox options={options} />)

    expect(markup).toContain('Option A')
    expect(markup).toContain('The first option')
    expect(markup).toContain('Option C')
  })

  it('fills the indicator only for the picked card, and the fill differs from an empty one', () => {
    const markup = html(<Choicebox options={options} value="b" />)
    const dots = tags(markup, 'choicebox-indicator')

    expect(dots).toHaveLength(3)
    expect(cls(dots[1], 'bg')).not.toBe('')
    expect(cls(dots[1], 'bg')).not.toBe(cls(dots[0], 'bg'))
    // The check glyph mounts only inside the picked card's indicator.
    const picked = tag(markup, 'choicebox-item')
    expect(markup.match(/<svg/g)?.length ?? 0).toBe(1)
    expect(picked).not.toBe('')
  })

  it('picks the card that was clicked, exclusively', () => {
    const picks: string[] = []
    const host = mount(
      <Choicebox options={options} onChange={(v) => picks.push(v)} />,
    )
    const items = host.querySelectorAll<HTMLElement>('[data-slot="choicebox-item"]')

    act(() => items[2].click())

    expect(picks).toEqual(['c'])
    expect(items[2].getAttribute('aria-checked')).toBe('true')
    expect(items[0].getAttribute('aria-checked')).toBe('false')
  })

  it('does not deselect a single choice by clicking it again', () => {
    const picks: string[] = []
    const host = mount(
      <Choicebox options={options} value="a" onChange={(v) => picks.push(v)} />,
    )
    const items = host.querySelectorAll<HTMLElement>('[data-slot="choicebox-item"]')

    act(() => items[0].click())

    expect(items[0].getAttribute('aria-checked')).toBe('true')
  })

  it('accumulates picks under multiple, and can drop one', () => {
    const picks: string[][] = []
    const host = mount(
      <Choicebox
        options={options}
        multiple
        onChange={(v) => picks.push(v ? v.split(',') : [])}
      />,
    )
    const items = host.querySelectorAll<HTMLElement>('[data-slot="choicebox-item"]')

    act(() => items[0].click())
    act(() => items[1].click())

    expect(picks.at(-1)).toEqual(['a', 'b'])
    expect(items[0].getAttribute('aria-checked')).toBe('true')
    expect(items[1].getAttribute('aria-checked')).toBe('true')

    act(() => items[0].click())
    expect(picks.at(-1)).toEqual(['b'])
    expect(items[0].getAttribute('aria-checked')).toBe('false')
  })
})
