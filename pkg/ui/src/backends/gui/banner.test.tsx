// @vitest-environment jsdom

/**
 * Banner's markup contract: the role, the variant reaching every part as a
 * compiled class, the icon's absolute placement, the message's indent, and the
 * close button's click firing `onClose` — asserted on compiled markup and on a
 * live DOM, never on a rendered color, because gui compiles style props to
 * atomic classes and a color assertion would only prove a class hash exists.
 *
 * Imports `./banner` directly rather than the backend barrel, so this test
 * cannot fail because an unrelated component's dependency moved.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Banner } from './banner'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  return {
    host,
    close: () => host.querySelector<HTMLElement>('[data-slot="banner-close"]'),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

/** The compiled class for one style property, e.g. cls(el, 'btc'). */
const cls = (el: string, prop: string) =>
  (el.match(/class="([^"]*)"/)?.[1] ?? '').split(/\s+/).find((c) => c.startsWith(`_${prop}-`)) ?? ''

describe('Banner', () => {
  it('renders as an alert region carrying its variant', () => {
    const markup = html(<Banner>Scheduled maintenance tonight.</Banner>)

    expect(tag(markup, 'banner')).toMatch(/role="alert"/)
    expect(tag(markup, 'banner')).toContain('data-variant="default"')
    expect(markup).toContain('Scheduled maintenance tonight.')
  })

  it('carries each variant onto the frame, and colors default apart from the rest', () => {
    const plain = html(<Banner>msg</Banner>)
    for (const variant of ['info', 'success', 'warning', 'error'] as const) {
      const markup = html(<Banner variant={variant}>msg</Banner>)
      expect(tag(markup, 'banner')).toContain(`data-variant="${variant}"`)
      expect(cls(tag(markup, 'banner'), 'btc')).not.toBe('')
      expect(cls(tag(markup, 'banner'), 'btc')).not.toBe(cls(tag(plain, 'banner'), 'btc'))
      expect(cls(tag(markup, 'banner-message'), 'col')).not.toBe(
        cls(tag(plain, 'banner-message'), 'col'),
      )
    }
  })

  it('lifts a leading icon out of the flow and indents the message to clear it', () => {
    const markup = html(
      <Banner>
        <svg data-testid="icon" />
        Heads up
      </Banner>,
    )
    const icon = tag(markup, 'banner-icon')

    expect(markup).toContain('data-testid="icon"')
    expect(cls(icon, 'pos')).toBe('_pos-absolute')
    expect(markup.indexOf('data-slot="banner-icon"')).toBeLessThan(
      markup.indexOf('data-slot="banner-message"'),
    )
    expect(cls(tag(markup, 'banner-message'), 'pl')).toBe('_pl-28px')
    expect(cls(tag(html(<Banner>plain</Banner>), 'banner-message'), 'pl')).not.toBe('_pl-28px')
  })

  it('renders no close button without onClose, and a real one with it', () => {
    expect(html(<Banner>msg</Banner>)).not.toContain('banner-close')

    const markup = html(<Banner onClose={() => {}}>msg</Banner>)
    const close = tag(markup, 'banner-close')
    expect(close).not.toBe('')
    expect(close.startsWith('<button')).toBe(true)
    expect(markup).toContain('aria-label="Close"')
    // Anchored in the corner, and still carrying the 44px hit-area marker —
    // `touch()` writes `position: relative` on web, so order matters here.
    expect(cls(close, 'pos')).toBe('_pos-absolute')
    expect(close).toMatch(/data-touch-y="\d+"/)
  })

  it('paints the message and the icon from different rungs of the hue', () => {
    const markup = html(
      <Banner variant="warning">
        <svg />
        msg
      </Banner>,
    )
    const icon = cls(tag(markup, 'banner-icon'), 'col')
    const text = cls(tag(markup, 'banner-message'), 'col')
    expect(icon).not.toBe('')
    expect(text).not.toBe('')
    expect(icon).not.toBe(text)
  })

  it('calls onClose when the close button is pressed', () => {
    const onClose = vi.fn()
    const view = mount(<Banner onClose={onClose}>msg</Banner>)

    act(() => {
      view.close()?.click()
    })

    expect(onClose).toHaveBeenCalledTimes(1)
    view.cleanup()
  })
})
