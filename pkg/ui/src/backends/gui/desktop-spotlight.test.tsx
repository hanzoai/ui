// @vitest-environment jsdom

/**
 * Spotlight's SELECTION contract: closed renders nothing, open shows every
 * item grouped by category, typing filters the list, picking a row runs its
 * action and reports the item, and Escape closes without picking anything.
 *
 * Asserted on a live DOM — the dialog mounts into gui's portal host, and the
 * filtering/keyboard behaviour is `Command`'s, only reachable once mounted.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Spotlight, type SpotlightItem } from './desktop-spotlight'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  return {
    host,
    root,
    rerender: (next: React.ReactNode) => act(() => root.render(wrap(next))),
    items: () => [...document.querySelectorAll<HTMLElement>('[data-slot="spotlight-item"]')],
    visibleItems: () =>
      [...document.querySelectorAll<HTMLElement>('[data-slot="spotlight-item"]')].filter(
        (el) => getComputedStyle(el).display !== 'none',
      ),
    input: () => document.querySelector<HTMLInputElement>('[data-slot="command-input"]'),
    groups: () => [...document.querySelectorAll<HTMLElement>('[data-slot="command-group-heading"]')],
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const items: SpotlightItem[] = [
  { id: 'settings', title: 'Settings', category: 'Applications' },
  { id: 'terminal', title: 'Terminal', category: 'Applications', keywords: ['shell'] },
  { id: 'documents', title: 'Documents', category: 'Folders', subtitle: 'Your files' },
]

describe('Spotlight', () => {
  it('renders nothing when closed', () => {
    const view = mount(<Spotlight isOpen={false} onClose={() => {}} items={items} />)

    expect(view.input()).toBeNull()
    view.cleanup()
  })

  it('shows every item, grouped by category, when open', () => {
    const view = mount(<Spotlight isOpen onClose={() => {}} items={items} />)

    expect(view.input()).toBeTruthy()
    expect(view.items()).toHaveLength(3)
    expect(view.groups().map((g) => g.textContent)).toEqual(['Applications', 'Folders'])
    view.cleanup()
  })

  it('filters the list as the search box is typed into', () => {
    const view = mount(<Spotlight isOpen onClose={() => {}} items={items} />)

    const input = view.input()!
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => {
      setter.call(input, 'shell')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })

    const visible = view.visibleItems()
    expect(visible).toHaveLength(1)
    expect(visible[0].textContent).toContain('Terminal')
    view.cleanup()
  })

  it('picking a row runs its action, reports the item, and closes', () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    const action = vi.fn()
    const withAction = [{ ...items[0], action }, items[1], items[2]]
    const view = mount(<Spotlight isOpen onClose={onClose} items={withAction} onSelect={onSelect} />)

    const settings = view.items().find((el) => el.textContent?.includes('Settings'))!
    act(() => settings.click())

    expect(action).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(withAction[0])
    expect(onClose).toHaveBeenCalledTimes(1)
    view.cleanup()
  })

  it('closes on Escape without picking anything', () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    const view = mount(<Spotlight isOpen onClose={onClose} items={items} onSelect={onSelect} />)

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onSelect).not.toHaveBeenCalled()
    view.cleanup()
  })

  it('shows a subtitle when the item has one', () => {
    const view = mount(<Spotlight isOpen onClose={() => {}} items={items} />)

    const documents = view.items().find((el) => el.textContent?.includes('Documents'))!
    expect(documents.textContent).toContain('Your files')
    view.cleanup()
  })

  it('shows the empty state for a query with no matches', () => {
    const view = mount(<Spotlight isOpen onClose={() => {}} items={items} />)

    const input = view.input()!
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => {
      setter.call(input, 'nonexistent-query')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })

    expect(view.host.ownerDocument.body.textContent).toContain('No results found')
    view.cleanup()
  })
})
