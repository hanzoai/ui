// @vitest-environment jsdom

/**
 * The Toggle, asserted on the compiled markup and on a real click.
 *
 * @hanzo/gui drops a prop it does not recognise silently — no throw, no type
 * error, just an element that never got the style. So every claim here is a
 * class or an attribute that actually reached the DOM node, never the text.
 *
 * Imports `./toggle` directly rather than the backend barrel: a test for one
 * component should not fail because a different one's dependency moved.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Toggle } from './toggle'

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

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

const PSEUDO = /^_[a-zA-Z]+-0(hover|press|focus|active|disabled)/
const cls = (el: string, prop: string) =>
  (el.match(/class="([^"]*)"/)?.[1] ?? '')
    .split(/\s+/)
    .find((c) => c.startsWith(`_${prop}-`) && !PSEUDO.test(c)) ?? ''

describe('Toggle', () => {
  it('renders a real button, off by default', () => {
    const markup = html(<Toggle>Bold</Toggle>)
    const el = tag(markup, 'toggle')

    expect(el.startsWith('<button')).toBe(true)
    expect(el).toContain('type="button"')
    expect(el).toContain('aria-pressed="false"')
    expect(el).toContain('data-state="off"')
  })

  it('starts on when defaultPressed is set', () => {
    const el = tag(html(<Toggle defaultPressed>Bold</Toggle>), 'toggle')

    expect(el).toContain('aria-pressed="true"')
    expect(el).toContain('data-state="on"')
  })

  it('flips state on click and reports it, uncontrolled', () => {
    const onPressedChange = vi.fn()
    const host = mount(<Toggle onPressedChange={onPressedChange}>Bold</Toggle>)
    const btn = host.querySelector<HTMLButtonElement>('[data-slot="toggle"]')!

    expect(btn.getAttribute('aria-pressed')).toBe('false')

    act(() => btn.click())
    expect(onPressedChange).toHaveBeenCalledWith(true)
    expect(btn.getAttribute('aria-pressed')).toBe('true')
    expect(btn.dataset.state).toBe('on')

    act(() => btn.click())
    expect(onPressedChange).toHaveBeenCalledWith(false)
    expect(btn.getAttribute('aria-pressed')).toBe('false')
  })

  it('stays under the caller’s control when pressed is passed', () => {
    const onPressedChange = vi.fn()
    const host = mount(
      <Toggle pressed={false} onPressedChange={onPressedChange}>
        Bold
      </Toggle>,
    )
    const btn = host.querySelector<HTMLButtonElement>('[data-slot="toggle"]')!

    act(() => btn.click())
    expect(onPressedChange).toHaveBeenCalledWith(true)
    // The prop never moved, so the DOM must not have moved either.
    expect(btn.getAttribute('aria-pressed')).toBe('false')
  })

  it('says on and off in the fill, and keeps it under hover', () => {
    const on = tag(html(<Toggle defaultPressed>Bold</Toggle>), 'toggle')
    const off = tag(html(<Toggle>Bold</Toggle>), 'toggle')

    expect(cls(on, 'bg')).not.toBe('')
    expect(cls(on, 'bg')).not.toBe(cls(off, 'bg'))
    const classes = on.match(/class="([^"]*)"/)?.[1] ?? ''
    expect(classes).toContain('_bg-0hover-rim')
  })

  it('carries the variant and size to the DOM', () => {
    const outline = tag(html(<Toggle variant="outline">A</Toggle>), 'toggle')
    expect(outline).toContain('data-variant="outline"')
    expect(cls(outline, 'btc')).toBe('_btc-borderColor')

    const sm = tag(html(<Toggle size="sm">A</Toggle>), 'toggle')
    expect(sm).toContain('data-size="sm"')
    expect(cls(sm, 'height')).toBe('_height-32px')

    const lg = tag(html(<Toggle size="lg">A</Toggle>), 'toggle')
    expect(cls(lg, 'height')).toBe('_height-40px')
  })

  it('looks and behaves disabled', () => {
    const el = tag(html(<Toggle disabled>A</Toggle>), 'toggle')

    expect(el).toContain('disabled=""')
    expect(el).toContain('data-disabled="true"')
    expect(cls(el, 'o')).toBe('_o-0--5')
  })

  it('does not flip when disabled', () => {
    const onPressedChange = vi.fn()
    const host = mount(
      <Toggle disabled onPressedChange={onPressedChange}>
        A
      </Toggle>,
    )
    const btn = host.querySelector<HTMLButtonElement>('[data-slot="toggle"]')!

    act(() => btn.click())
    expect(onPressedChange).not.toHaveBeenCalled()
    expect(btn.getAttribute('aria-pressed')).toBe('false')
  })
})
