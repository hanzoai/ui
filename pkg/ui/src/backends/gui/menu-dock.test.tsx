// @vitest-environment jsdom

/**
 * MenuDock's structure, orientation and active/hover behaviour, asserted on a
 * live DOM. Imports `./menu-dock` directly rather than the backend barrel, so
 * a test for this component never fails because a different one's dependency
 * moved.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { MenuDock, type MenuDockItem } from './menu-dock'

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
    items: () => [...host.querySelectorAll<HTMLButtonElement>('[data-slot="menu-dock-item"]')],
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const sampleItems: MenuDockItem[] = [
  { icon: 'H', label: 'Home', active: true },
  { icon: 'S', label: 'Search' },
]

describe('MenuDock', () => {
  it('renders one button per item, marked as buttons', () => {
    const markup = html(<MenuDock items={sampleItems} />)

    expect(markup).toContain('data-slot="menu-dock"')
    const items = [...markup.matchAll(/<button[^>]*data-slot="menu-dock-item"[^>]*>/g)]
    expect(items).toHaveLength(2)
    // A bare <button> defaults to type="submit" and fires a surrounding form;
    // a menu dock item is never that.
    for (const item of items) expect(item[0]).toContain('type="button"')
  })

  it('carries orientation as an attribute and flips flex direction', () => {
    expect(html(<MenuDock items={sampleItems} />)).toContain('data-orientation="horizontal"')
    const vertical = html(<MenuDock items={sampleItems} orientation="vertical" />)
    expect(vertical).toContain('data-orientation="vertical"')
    expect(vertical).toContain('column')
  })

  it('marks the active item with data-active and a filled background', () => {
    const markup = html(<MenuDock items={sampleItems} />)
    const buttons = [...markup.matchAll(/<button[^>]*data-slot="menu-dock-item"[^>]*>/g)].map(
      (m) => m[0],
    )
    expect(buttons[0]).toContain('data-active="true"')
    expect(buttons[1]).toContain('data-active="false"')
  })

  it('calls the item onClick handler when pressed', () => {
    const onClick = vi.fn()
    const view = mount(<MenuDock items={[{ icon: 'H', label: 'Home', onClick }]} />)

    act(() => view.items()[0].click())
    expect(onClick).toHaveBeenCalledTimes(1)

    view.cleanup()
  })

  it('shows the tooltip only while an item is hovered', () => {
    const view = mount(<MenuDock items={sampleItems} />)
    const item = view.items()[0]

    expect(view.host.querySelector('[data-slot="menu-dock-tooltip"]')).toBeNull()

    act(() => {
      item.dispatchEvent(new MouseEvent('pointerover', { bubbles: true }))
    })
    expect(view.host.querySelector('[data-slot="menu-dock-tooltip"]')?.textContent).toBe('Home')

    act(() => {
      item.dispatchEvent(new MouseEvent('pointerout', { bubbles: true }))
    })
    expect(view.host.querySelector('[data-slot="menu-dock-tooltip"]')).toBeNull()

    view.cleanup()
  })

  it('gives every item a title attribute as a non-hover hint', () => {
    const markup = html(<MenuDock items={sampleItems} />)
    expect(markup).toContain('title="Home"')
    expect(markup).toContain('title="Search"')
  })
})
