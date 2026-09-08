// @vitest-environment jsdom

/**
 * NavigationBar's variants, asserted on compiled markup and on a live DOM —
 * @hanzo/gui drops an unrecognised prop with no throw, so only the rendered
 * tag, slot marker and attribute prove a variant actually took.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { NavigationBar } from './navigation-bar'

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
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

describe('NavigationBar', () => {
  it('renders a nav landmark carrying the variant', () => {
    const markup = html(<NavigationBar items={[{ label: 'Home', href: '/' }]} />)
    const bar = tag(markup, 'navigation-bar')

    expect(bar.startsWith('<nav')).toBe(true)
    expect(bar).toContain('data-variant="simple"')
  })

  it('simple: renders every link as a real anchor with its href', () => {
    const markup = html(
      <NavigationBar
        variant="simple"
        logo="Acme"
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Pricing', href: '/pricing' },
        ]}
      />,
    )

    expect(markup).toContain('Acme')
    expect(markup).toMatch(/<a[^>]*href="\/docs"[^>]*>Docs<\/a>/)
    expect(markup).toMatch(/<a[^>]*href="\/pricing"[^>]*>Pricing<\/a>/)
  })

  it('centered: keeps left and right links either side of the logo', () => {
    const markup = html(
      <NavigationBar
        variant="centered"
        logo="Brand"
        leftItems={[{ label: 'Shop', href: '/shop' }]}
        rightItems={[{ label: 'Account', href: '/account' }]}
      />,
    )
    const logoAt = markup.indexOf('Brand')
    const leftAt = markup.indexOf('Shop')
    const rightAt = markup.indexOf('Account')

    expect(leftAt).toBeGreaterThan(-1)
    expect(rightAt).toBeGreaterThan(leftAt)
    expect(logoAt).toBeGreaterThan(leftAt)
    expect(logoAt).toBeLessThan(rightAt)
  })

  it('breadcrumb: trails an ordered list, marks the current step, and separates the rest', () => {
    const markup = html(
      <NavigationBar
        variant="breadcrumb"
        items={[{ label: 'Home', href: '/' }, { label: 'Settings', href: '/settings' }, { label: 'Profile' }]}
      />,
    )

    expect(tag(markup, 'navigation-bar').startsWith('<nav')).toBe(true)
    expect(markup).toMatch(/<ol[^>]*>/)
    expect((markup.match(/<li/g) ?? []).length).toBe(3)
    // Two separators between three steps.
    expect((markup.match(/<svg/g) ?? []).length).toBe(2)
    // The final crumb has no href and announces itself as the current page.
    const current = markup.match(/<span[^>]*aria-current="page"[^>]*>Profile<\/span>/)
    expect(current).not.toBeNull()
  })

  it('icon: renders each item as a link carrying its own label and icon', () => {
    const markup = html(
      <NavigationBar
        variant="icon"
        items={[{ label: 'Search', href: '/search', icon: <svg data-testid="search-icon" /> }]}
      />,
    )

    expect(markup).toMatch(/<a[^>]*href="\/search"[^>]*title="Search"/)
    expect(markup).toContain('Search')
  })

  it('dashboard: shows the title and an avatar built from the user', () => {
    const markup = html(<NavigationBar variant="dashboard" title="Overview" user={{ name: 'Ada' }} />)

    expect(markup).toContain('Overview')
    expect(markup).toContain('data-slot="avatar"')
    expect(markup).toContain('>A<')
  })

  it('ecommerce: shows the cart count only once items are in the cart', () => {
    const empty = html(<NavigationBar variant="ecommerce" logo="Shop" cartCount={0} />)
    const full = html(<NavigationBar variant="ecommerce" logo="Shop" cartCount={3} />)

    expect(empty).not.toContain('navigation-bar-cart-count')
    expect(full).toContain('navigation-bar-cart-count')
    expect(full).toContain('>3<')
  })

  it('collaboration: caps the visible avatar stack and counts the overflow', () => {
    const markup = html(
      <NavigationBar
        variant="collaboration"
        title="Q3 plan"
        collaborators={[{ name: 'Ada' }, { name: 'Bo' }, { name: 'Cy' }, { name: 'Dee' }]}
      />,
    )

    expect((markup.match(/data-slot="avatar"/g) ?? []).length).toBe(4)
    expect(markup).toContain('+1')
  })

  it('communication: fires its call, video and message callbacks', () => {
    const onCall = vi.fn()
    const onVideo = vi.fn()
    const onMessage = vi.fn()
    const view = mount(
      <NavigationBar variant="communication" contactName="Ada Lovelace" onCall={onCall} onVideo={onVideo} onMessage={onMessage} />,
    )
    const buttons = [...view.host.querySelectorAll<HTMLButtonElement>('button[aria-label]')]

    expect(view.host.textContent).toContain('Ada Lovelace')
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual(['Call', 'Video call', 'Message'])
    act(() => buttons[0].click())
    act(() => buttons[1].click())
    act(() => buttons[2].click())
    expect(onCall).toHaveBeenCalledTimes(1)
    expect(onVideo).toHaveBeenCalledTimes(1)
    expect(onMessage).toHaveBeenCalledTimes(1)
    view.cleanup()
  })

  it('switcher: opens the menu from its trigger and reports the chosen option', () => {
    const onValueChange = vi.fn()
    const view = mount(
      <NavigationBar
        variant="switcher"
        value="gpt"
        options={[
          { id: 'gpt', label: 'GPT' },
          { id: 'claude', label: 'Claude' },
        ]}
        onValueChange={onValueChange}
      />,
    )
    const trigger = view.host.querySelector<HTMLElement>('[data-slot="navigation-bar-switcher-trigger"]')
    expect(trigger).not.toBeNull()
    expect(trigger?.textContent).toContain('GPT')

    act(() => trigger?.click())
    const item = [...document.querySelectorAll<HTMLElement>('[data-slot="dropdown-menu-item"], [role="menuitem"]')].find(
      (el) => el.textContent?.includes('Claude'),
    )
    expect(item).toBeTruthy()
    act(() => item?.click())
    expect(onValueChange).toHaveBeenCalledWith('claude')

    view.cleanup()
  })
})
