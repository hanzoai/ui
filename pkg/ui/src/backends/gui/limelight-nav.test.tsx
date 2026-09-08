// @vitest-environment jsdom

/**
 * LimelightNav's a11y contract and its active-item behaviour, asserted on a
 * live DOM. Imports `./limelight-nav` directly rather than the backend
 * barrel, the same way `accordion.test.tsx` does, so this fails only when
 * this component's own dependency moves.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { LimelightNav, type LimelightNavItem } from './limelight-nav'

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
    tabs: () => [...host.querySelectorAll<HTMLElement>('[data-slot="limelight-nav-item"]')],
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const items: LimelightNavItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'docs', label: 'Docs' },
  { id: 'about', label: 'About' },
]

describe('LimelightNav', () => {
  it('renders a tablist with one tab per item and marks the active one', () => {
    const markup = html(<LimelightNav items={items} defaultValue="docs" />)

    expect(markup).toContain('role="tablist"')
    const tabs = [...markup.matchAll(/<[a-z0-9]+[^>]*data-slot="limelight-nav-item"[^>]*>/g)].map((m) => m[0])
    expect(tabs).toHaveLength(3)
    expect(tabs[1]).toContain('aria-selected="true"')
    expect(tabs[1]).toContain('aria-current="page"')
    expect(tabs[0]).toContain('aria-selected="false"')
    expect(tabs[0]).not.toContain('aria-current')
  })

  it('renders the glow that trails the active item', () => {
    const markup = html(<LimelightNav items={items} defaultValue="home" />)
    expect(markup).toContain('data-slot="limelight-nav-glow"')
    expect(markup).toContain('data-slot="limelight-nav-beam"')
  })

  it('drops the beam and squares the glow for the bar variant', () => {
    const markup = html(<LimelightNav items={items} defaultValue="home" variant="bar" />)
    expect(markup).not.toContain('data-slot="limelight-nav-beam"')
    expect(markup).toContain('data-slot="limelight-nav-glow"')
  })

  it('moves the active tab on click and calls onValueChange, uncontrolled', () => {
    const onValueChange = vi.fn()
    const view = mount(<LimelightNav items={items} defaultValue="home" onValueChange={onValueChange} />)

    act(() => {
      view.tabs()[2].click()
    })

    expect(onValueChange).toHaveBeenCalledWith('about')
    expect(view.tabs()[2].getAttribute('aria-selected')).toBe('true')
    expect(view.tabs()[0].getAttribute('aria-selected')).toBe('false')

    view.cleanup()
  })

  it('stays on the controlled value when a click fires without the caller updating it', () => {
    const onValueChange = vi.fn()
    const view = mount(<LimelightNav items={items} value="home" onValueChange={onValueChange} />)

    act(() => {
      view.tabs()[1].click()
    })

    expect(onValueChange).toHaveBeenCalledWith('docs')
    // Controlled: prop never changed, so the DOM still reflects "home".
    expect(view.tabs()[0].getAttribute('aria-selected')).toBe('true')

    view.cleanup()
  })

  it('moves focus and activation with arrow keys, wrapping at the ends', () => {
    const onValueChange = vi.fn()
    const view = mount(<LimelightNav items={items} defaultValue="about" onValueChange={onValueChange} />)

    act(() => {
      view.tabs()[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    })
    expect(onValueChange).toHaveBeenCalledWith('home')
    expect(document.activeElement).toBe(view.tabs()[0])

    act(() => {
      view.tabs()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    })
    expect(onValueChange).toHaveBeenCalledWith('about')

    act(() => {
      view.tabs()[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    })
    expect(onValueChange).toHaveBeenCalledWith('home')

    view.cleanup()
  })

  it('renders a real anchor for an item with an href', () => {
    const markup = html(
      <LimelightNav items={[{ id: 'ext', label: 'Docs', href: '/docs' }]} defaultValue="ext" />,
    )
    expect(markup).toMatch(/<a[^>]*data-slot="limelight-nav-item"[^>]*href="\/docs"/)
  })
})
