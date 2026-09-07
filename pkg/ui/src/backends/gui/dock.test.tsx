// @vitest-environment jsdom

/**
 * The Dock's structure and its magnify-on-hover behaviour, asserted on a live
 * DOM — a pointermove only means anything once React has attached a real
 * listener, and static markup can't show a size that changes after mount.
 *
 * Imports `./dock` directly rather than the backend barrel, so a test for this
 * component never fails because a different one's dependency moved.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Dock, DockItem, DockSeparator } from './dock'

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
    items: () => [...host.querySelectorAll<HTMLButtonElement>('[data-slot="dock-item"]')],
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('Dock', () => {
  it('renders a dock with its items, marked as buttons', () => {
    const markup = html(
      <Dock>
        <DockItem tooltip="Home">home</DockItem>
        <DockItem tooltip="Search">search</DockItem>
      </Dock>,
    )

    expect(markup).toContain('data-slot="dock"')
    const items = [...markup.matchAll(/<button[^>]*data-slot="dock-item"[^>]*>/g)]
    expect(items).toHaveLength(2)
  })

  it('carries the requested position as an attribute', () => {
    expect(html(<Dock position="left" />)).toContain('data-position="left"')
    expect(html(<Dock position="right" />)).toContain('data-position="right"')
    expect(html(<Dock />)).toContain('data-position="bottom"')
  })

  it('calls the item onClick handler when it is pressed', () => {
    const onClick = vi.fn()
    const view = mount(
      <Dock>
        <DockItem onClick={onClick}>a</DockItem>
      </Dock>,
    )

    act(() => view.items()[0].click())
    expect(onClick).toHaveBeenCalledTimes(1)

    view.cleanup()
  })

  it('grows the hovered item and settles back on pointer leave', () => {
    const view = mount(
      <Dock magnification={60} distance={140}>
        <DockItem tooltip="Home">a</DockItem>
      </Dock>,
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

  it('shows the tooltip only while the item is hovered', () => {
    const view = mount(
      <Dock>
        <DockItem tooltip="Home">a</DockItem>
      </Dock>,
    )
    const item = view.items()[0]
    item.getBoundingClientRect = () =>
      ({ left: 0, right: 48, top: 0, bottom: 48, width: 48, height: 48 }) as DOMRect

    expect(view.host.querySelector('[data-slot="dock-tooltip"]')).toBeNull()

    act(() => {
      item.dispatchEvent(new MouseEvent('pointerover', { bubbles: true, clientX: 24, clientY: 20 }))
    })
    expect(view.host.querySelector('[data-slot="dock-tooltip"]')?.textContent).toBe('Home')

    act(() => {
      item.dispatchEvent(new MouseEvent('pointerout', { bubbles: true }))
    })
    expect(view.host.querySelector('[data-slot="dock-tooltip"]')).toBeNull()

    view.cleanup()
  })

  it('renders a separator that flips axis with the dock position', () => {
    const bottom = html(
      <Dock position="bottom">
        <DockSeparator />
      </Dock>,
    )
    const left = html(
      <Dock position="left">
        <DockSeparator />
      </Dock>,
    )

    const widthOf = (markup: string) => markup.match(/width:\s*([\d.]+)px/)?.[1]
    expect(bottom).toContain('data-slot="dock-separator"')
    // Bottom (row) dock: a separator is a tall vertical line, width 1.
    expect(widthOf(bottom)).toBe('1')
    // Left/right (column) dock: a separator is a wide horizontal line, width 40.
    expect(widthOf(left)).toBe('40')
  })
})
