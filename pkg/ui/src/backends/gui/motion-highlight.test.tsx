// @vitest-environment jsdom

/**
 * MotionHighlight is asserted on a live DOM: the glow is absent until the
 * pointer enters, appears at the entered coordinate, moves with the pointer,
 * and disappears again on leave. Imports `./motion-highlight` directly, not
 * the backend barrel, so this test only fails for its own component.
 */
import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { MotionHighlight } from './motion-highlight'

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
    frame: () => host.querySelector<HTMLElement>('[data-slot="motion-highlight"]')!,
    glow: () => host.querySelector<HTMLElement>('[data-slot="motion-highlight-glow"]'),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const move = (el: HTMLElement, clientX: number, clientY: number) => {
  el.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    right: 100,
    bottom: 100,
    width: 100,
    height: 100,
    x: 0,
    y: 0,
    toJSON() {},
  })
  act(() => {
    // React derives mouseenter/mouseleave from bubbling mouseover/mouseout at
    // the delegated root, so a non-bubbling 'mouseenter' never reaches it.
    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX, clientY }))
    el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX, clientY }))
  })
}

describe('MotionHighlight', () => {
  it('renders its content and no glow before any pointer activity', () => {
    const view = mount(<MotionHighlight>hello</MotionHighlight>)

    expect(view.frame().textContent).toBe('hello')
    expect(view.glow()).toBeNull()

    view.cleanup()
  })

  it('shows the glow at the entered position once the pointer moves in', () => {
    const view = mount(<MotionHighlight size={64}>content</MotionHighlight>)

    move(view.frame(), 20, 30)

    const glow = view.glow()
    expect(glow).not.toBeNull()
    // translate(x - size/2, y - size/2) with size 64
    expect(glow!.style.transform).toBe('translate(-12px, -2px)')
    expect(glow!.style.width).toBe('64px')

    view.cleanup()
  })

  it('tracks the pointer as it moves and clears on leave', () => {
    const view = mount(<MotionHighlight size={64}>content</MotionHighlight>)
    const frame = view.frame()

    move(frame, 20, 30)
    move(frame, 40, 50)
    expect(view.glow()!.style.transform).toBe('translate(8px, 18px)')

    act(() => {
      frame.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }))
    })
    expect(view.glow()).toBeNull()

    view.cleanup()
  })

  it('applies a custom glow color', () => {
    const view = mount(
      <MotionHighlight color="rgba(255,0,0,0.5)">content</MotionHighlight>,
    )

    move(view.frame(), 10, 10)
    expect(view.glow()!.style.background).toBe('rgba(255, 0, 0, 0.5)')

    view.cleanup()
  })
})
