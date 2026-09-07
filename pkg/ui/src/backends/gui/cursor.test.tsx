// @vitest-environment jsdom

/**
 * Cursor tracks the pointer locally off `getBoundingClientRect` and only
 * renders the dot once the pointer has entered the frame, so the meaningful
 * assertions are against a live tree, never static markup.
 */
import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Cursor } from './cursor'

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
    frame: () => host.querySelector<HTMLElement>('[data-slot="cursor"]'),
    dot: () => host.querySelector<HTMLElement>('[data-slot="cursor-dot"]'),
    text: () => host.querySelector<HTMLElement>('[data-slot="cursor-text"]'),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('Cursor', () => {
  it('renders nothing until the pointer enters the frame', () => {
    const view = mount(<Cursor>content</Cursor>)
    expect(view.frame()).toBeTruthy()
    expect(view.dot()).toBeNull()
    view.cleanup()
  })

  it('shows the dot on enter and removes it on leave', () => {
    const view = mount(<Cursor>content</Cursor>)
    const frame = view.frame()!

    act(() => {
      frame.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, relatedTarget: document.body }))
    })
    expect(view.dot()).toBeTruthy()

    act(() => {
      frame.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }))
    })
    expect(view.dot()).toBeNull()

    view.cleanup()
  })

  it('positions the dot relative to the frame, from a mousemove', () => {
    const view = mount(<Cursor cursorSize={24}>content</Cursor>)
    const frame = view.frame()!
    frame.getBoundingClientRect = () =>
      ({ left: 10, top: 20, right: 0, bottom: 0, width: 0, height: 0, x: 10, y: 20, toJSON() {} }) as DOMRect

    act(() => {
      frame.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, relatedTarget: document.body }))
    })
    act(() => {
      frame.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 110, clientY: 120 }))
    })

    const dot = view.dot()!
    expect(dot.style.left).toBe('100px')
    expect(dot.style.top).toBe('100px')
    expect(dot.style.width).toBe('24px')
    expect(dot.style.height).toBe('24px')

    view.cleanup()
  })

  it('renders the label inside the dot when cursorText is given, and omits it otherwise', () => {
    const labeled = mount(<Cursor cursorText="✨">content</Cursor>)
    act(() => {
      labeled.frame()!.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, relatedTarget: document.body }))
    })
    expect(labeled.text()?.textContent).toBe('✨')
    labeled.cleanup()

    const bare = mount(<Cursor>content</Cursor>)
    act(() => {
      bare.frame()!.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, relatedTarget: document.body }))
    })
    expect(bare.text()).toBeNull()
    bare.cleanup()
  })

  it('masks the native cursor on the frame alone', () => {
    const view = mount(<Cursor>content</Cursor>)
    expect(view.frame()!.style.cursor).toBe('none')
    view.cleanup()
  })
})
