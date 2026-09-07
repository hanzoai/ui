// @vitest-environment jsdom

/**
 * AnimatedCursor is DOM-driven — position, hover shape and click state all
 * come from document-level listeners — so the only meaningful assertions are
 * against a live tree, never static markup.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { AnimatedCursor } from './animated-cursor'

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
    frame: () => host.querySelector<HTMLElement>('[data-slot="animated-cursor"]'),
    dot: () => host.querySelector<HTMLElement>('[data-slot="animated-cursor-dot"]'),
    ring: () => host.querySelector<HTMLElement>('[data-slot="animated-cursor-ring"]'),
    trailDots: () => host.querySelectorAll('[data-slot="animated-cursor-trail"]'),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const move = (x: number, y: number) => {
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }))
}

/** What the pointer would show over an element that sets its own cursor. */
const cursorOver = (el: Element) => getComputedStyle(el).cursor

/** A control with a cursor of its own, the way every gui Button has one. */
const control = () => {
  const el = document.createElement('button')
  el.style.cursor = 'pointer'
  document.body.appendChild(el)
  return el
}

const touchPoints = (n: number) =>
  Object.defineProperty(navigator, 'maxTouchPoints', { value: n, configurable: true })

describe('AnimatedCursor', () => {
  afterEach(() => touchPoints(0))

  it('hides on a touch device by default, and shows when told not to', () => {
    touchPoints(1)
    const hidden = mount(<AnimatedCursor />)
    expect(hidden.dot()).toBeNull()
    hidden.cleanup()

    const shown = mount(<AnimatedCursor hideOnTouch={false} />)
    expect(shown.dot()).toBeTruthy()
    shown.cleanup()
  })

  // Hiding the body's cursor alone leaves a button's own `cursor: pointer` and
  // a field's I-beam showing beside the dot, so the check is over a control
  // that sets its own.
  it('hides the native cursor over every element while live, and gives it back', () => {
    const button = control()
    expect(cursorOver(button)).toBe('pointer')

    const view = mount(<AnimatedCursor hideOnTouch={false} />)
    expect(view.dot()).toBeTruthy()
    expect(cursorOver(button)).toBe('none')
    expect(cursorOver(document.body)).toBe('none')

    view.cleanup()
    expect(cursorOver(button)).toBe('pointer')
    button.remove()
  })

  it('leaves the native cursor alone while isVisible is off', () => {
    const button = control()
    const view = mount(<AnimatedCursor isVisible={false} hideOnTouch={false} />)

    expect(view.dot()).toBeNull()
    expect(cursorOver(button)).toBe('pointer')

    view.cleanup()
    button.remove()
  })

  it('follows the pointer to a new position', () => {
    const view = mount(<AnimatedCursor size={20} hideOnTouch={false} />)

    act(() => move(100, 150))

    const dot = view.dot()!
    expect(dot.style.left).toBe('90px')
    expect(dot.style.top).toBe('140px')

    view.cleanup()
  })

  it('grows on hover and shrinks on click, and shows a ring only while hovering', () => {
    const view = mount(
      <div>
        <AnimatedCursor hoverScale={2} hideOnTouch={false} />
        <button data-testid="target">hover me</button>
      </div>,
    )

    expect(view.ring()).toBeNull()

    const button = view.host.querySelector('[data-testid="target"]')!
    act(() => {
      button.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    })
    expect(view.dot()!.style.transform).toBe('scale(2)')
    expect(view.ring()).toBeTruthy()

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })
    expect(view.dot()!.style.transform).toBe('scale(1.6)')

    act(() => {
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    })
    expect(view.dot()!.style.transform).toBe('scale(2)')

    view.cleanup()
  })

  it('builds a trail up to trailLength and stops once showTrail is false', () => {
    const view = mount(<AnimatedCursor trailLength={3} hideOnTouch={false} />)

    for (let i = 0; i < 6; i++) act(() => move(i * 10, i * 10))
    expect(view.trailDots()).toHaveLength(3)

    view.cleanup()

    const flat = mount(<AnimatedCursor showTrail={false} hideOnTouch={false} />)
    act(() => move(5, 5))
    expect(flat.trailDots()).toHaveLength(0)
    flat.cleanup()

    // `slice(-0)` is the whole array, so a zero length has to mean none, not all.
    const none = mount(<AnimatedCursor trailLength={0} hideOnTouch={false} />)
    for (let i = 0; i < 3; i++) act(() => move(i, i))
    expect(none.trailDots()).toHaveLength(0)
    none.cleanup()
  })

  it('paints the theme ink by default and any CSS colour it is given', () => {
    const themed = mount(<AnimatedCursor hideOnTouch={false} />)
    expect(themed.dot()!.style.backgroundColor).toBe('var(--color)')
    themed.cleanup()

    const red = mount(<AnimatedCursor color="rgb(255, 0, 0)" hideOnTouch={false} />)
    expect(red.dot()!.style.backgroundColor).toBe('rgb(255, 0, 0)')
    red.cleanup()
  })

  // A fixed frame with no z-index stacks at zero, under any overlay — and the
  // native cursor is hidden meanwhile, so over a modal there would be none.
  it('stacks the frame at zIndex so the dot stays above overlays', () => {
    const view = mount(<AnimatedCursor zIndex={70} hideOnTouch={false} />)
    expect(view.frame()!.style.zIndex).toBe('70')
    expect(view.dot()!.style.zIndex).toBe('70')
    view.cleanup()
  })

  it('switches to a thin bar and drops the hover ring for a text target', () => {
    const view = mount(
      <div>
        <AnimatedCursor size={20} hideOnTouch={false} />
        <input data-testid="field" type="text" />
      </div>,
    )

    const input = view.host.querySelector('[data-testid="field"]')!
    act(() => {
      input.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    })

    const dot = view.dot()!
    expect(dot.style.width).toBe('2px')
    expect(dot.style.height).toBe('24px')
    expect(view.ring()).toBeNull()

    view.cleanup()
  })

  it('squares the dot over a grab target', () => {
    const view = mount(
      <div>
        <AnimatedCursor hideOnTouch={false} />
        <span data-cursor="grab">drag me</span>
      </div>,
    )

    act(() => {
      view.host.querySelector('[data-cursor="grab"]')!.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    })

    expect(view.dot()!.dataset.shape).toBe('grab')
    expect(view.dot()!.style.borderRadius).toBe('6px')

    view.cleanup()
  })
})
