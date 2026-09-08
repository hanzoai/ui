// @vitest-environment jsdom

/**
 * MacosDock's structure, glass material, and magnify-on-hover behaviour,
 * asserted on a live DOM — a pointermove only means anything once React has
 * attached a real listener, and static markup can't show a size that changes
 * after mount.
 *
 * Imports `./macos-dock` directly rather than the backend barrel, so a test
 * for this component never fails because a different one's dependency moved.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { MacosDock, MacosDockItem } from './macos-dock'

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
    items: () => [...host.querySelectorAll<HTMLButtonElement>('[data-slot="macos-dock-item"]')],
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('MacosDock', () => {
  it('renders a dock with its items, marked as buttons, wearing the glass material', () => {
    const markup = html(
      <MacosDock>
        <MacosDockItem tooltip="Finder">home</MacosDockItem>
        <MacosDockItem tooltip="Safari">search</MacosDockItem>
      </MacosDock>,
    )

    expect(markup).toContain('data-slot="macos-dock"')
    expect(markup).toContain('glass')
    const items = [...markup.matchAll(/<button[^>]*data-slot="macos-dock-item"[^>]*>/g)]
    expect(items).toHaveLength(2)
    // A bare <button> defaults to type="submit" and fires a surrounding form;
    // a dock item is never that.
    for (const item of items) expect(item[0]).toContain('type="button"')
  })

  it('calls the item onClick handler when it is pressed', () => {
    const onClick = vi.fn()
    const view = mount(
      <MacosDock>
        <MacosDockItem onClick={onClick}>a</MacosDockItem>
      </MacosDock>,
    )

    act(() => view.items()[0].click())
    expect(onClick).toHaveBeenCalledTimes(1)

    view.cleanup()
  })

  it('grows the hovered item and settles back on pointer leave', () => {
    const view = mount(
      <MacosDock magnification={60} distance={140}>
        <MacosDockItem tooltip="Finder">a</MacosDockItem>
      </MacosDock>,
    )
    const item = view.items()[0]
    item.getBoundingClientRect = () =>
      ({ left: 100, right: 148, top: 0, bottom: 48, width: 48, height: 48 }) as DOMRect

    const restSize = item.style.width

    act(() => {
      item.dispatchEvent(
        new MouseEvent('pointerover', { bubbles: true, clientX: 124, clientY: 20 }),
      )
      item.dispatchEvent(
        new MouseEvent('pointermove', { bubbles: true, clientX: 124, clientY: 20 }),
      )
    })
    // Pointer sits on the item's centre: full magnification applies, so the
    // item is now strictly wider than its resting size.
    expect(parseFloat(item.style.width)).toBeGreaterThan(parseFloat(restSize))

    act(() => {
      item.dispatchEvent(new MouseEvent('pointerout', { bubbles: true }))
    })
    expect(item.style.width).toBe(restSize)

    view.cleanup()
  })

  it('shows a glass tooltip only while the item is hovered', () => {
    const view = mount(
      <MacosDock>
        <MacosDockItem tooltip="Finder">a</MacosDockItem>
      </MacosDock>,
    )
    const item = view.items()[0]
    item.getBoundingClientRect = () =>
      ({ left: 0, right: 48, top: 0, bottom: 48, width: 48, height: 48 }) as DOMRect

    expect(view.host.querySelector('[data-slot="macos-dock-tooltip"]')).toBeNull()

    act(() => {
      item.dispatchEvent(new MouseEvent('pointerover', { bubbles: true, clientX: 24, clientY: 20 }))
    })
    const tooltip = view.host.querySelector('[data-slot="macos-dock-tooltip"]')
    expect(tooltip?.textContent).toBe('Finder')
    expect(tooltip?.className).toContain('glass')

    act(() => {
      item.dispatchEvent(new MouseEvent('pointerout', { bubbles: true }))
    })
    expect(view.host.querySelector('[data-slot="macos-dock-tooltip"]')).toBeNull()

    view.cleanup()
  })

  it('turns off magnification when distance is zero', () => {
    const view = mount(
      <MacosDock magnification={60} distance={0}>
        <MacosDockItem tooltip="Finder">a</MacosDockItem>
      </MacosDock>,
    )
    const item = view.items()[0]
    item.getBoundingClientRect = () =>
      ({ left: 100, right: 148, top: 0, bottom: 48, width: 48, height: 48 }) as DOMRect

    const restSize = item.style.width

    act(() => {
      item.dispatchEvent(
        new MouseEvent('pointerover', { bubbles: true, clientX: 124, clientY: 20 }),
      )
      item.dispatchEvent(
        new MouseEvent('pointermove', { bubbles: true, clientX: 124, clientY: 20 }),
      )
    })
    expect(item.style.width).toBe(restSize)

    view.cleanup()
  })
})
