// @vitest-environment jsdom

/**
 * Cursor's behaviour, asserted on a live DOM: the follower is absent until
 * the pointer enters the frame, tracks the pointer relative to the frame's
 * own box, and carries the optional label.
 *
 * Imports `./cursor` directly rather than the backend barrel, so this test
 * only fails when cursor itself regresses.
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
    frame: () => host.querySelector<HTMLElement>('[data-slot="cursor"]')!,
    dot: () => host.querySelector<HTMLElement>('[data-slot="cursor-dot"]'),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('Cursor', () => {
  it('renders the frame and no dot before the pointer enters', () => {
    const view = mount(<Cursor>content</Cursor>)

    expect(view.frame()).toBeTruthy()
    expect(view.dot()).toBeNull()
    view.cleanup()
  })

  it('draws the dot on mouse enter and drops it on mouse leave', () => {
    const view = mount(<Cursor>content</Cursor>)

    act(() => {
      view.frame().dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    })
    expect(view.dot()).toBeTruthy()

    act(() => {
      view.frame().dispatchEvent(new MouseEvent('mouseout', { bubbles: true }))
    })
    expect(view.dot()).toBeNull()

    view.cleanup()
  })

  it('positions the dot relative to the frame, not the viewport', () => {
    const view = mount(<Cursor cursorSize={24}>content</Cursor>)
    const frame = view.frame()
    frame.getBoundingClientRect = () =>
      ({ left: 100, top: 50, right: 300, bottom: 250, width: 200, height: 200 }) as DOMRect

    act(() => {
      frame.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    })
    act(() => {
      frame.dispatchEvent(
        new MouseEvent('mousemove', { bubbles: true, clientX: 140, clientY: 90 }),
      )
    })

    const dot = view.dot()!
    expect(dot.style.left).toBe('40px')
    expect(dot.style.top).toBe('40px')
    expect(dot.style.width).toBe('24px')
    expect(dot.style.height).toBe('24px')

    view.cleanup()
  })

  it('draws the label only when cursorText is given', () => {
    const withLabel = mount(<Cursor cursorText="✨">content</Cursor>)
    act(() => {
      withLabel.frame().dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    })
    expect(withLabel.dot()!.textContent).toBe('✨')
    withLabel.cleanup()

    const bare = mount(<Cursor>content</Cursor>)
    act(() => {
      bare.frame().dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    })
    expect(bare.dot()!.textContent).toBe('')
    bare.cleanup()
  })
})
