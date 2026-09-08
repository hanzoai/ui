// @vitest-environment jsdom

/**
 * StarsScrollingWheel's picker contract, asserted on a live DOM — a click, a
 * key or a wheel event only means anything mounted, the way accordion.test.tsx
 * asserts its own interactions.
 *
 * Imports `./stars-scrolling-wheel` directly rather than the backend barrel,
 * for the same reason accordion.test.tsx does: a test for one component should
 * not fail because a different one's dependency moved.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { StarsScrollingWheel } from './stars-scrolling-wheel'

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
    wheel: () => host.querySelector<HTMLElement>('[data-slot="stars-scrolling-wheel"]')!,
    rows: () => [...host.querySelectorAll<HTMLElement>('[data-slot="stars-scrolling-wheel-row"]')],
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('StarsScrollingWheel', () => {
  it('draws one row per rating from 0 to max', () => {
    const view = mount(<StarsScrollingWheel max={5} />)
    const rows = view.rows()

    expect(rows).toHaveLength(6)
    expect(rows.map((r) => r.getAttribute('data-value'))).toEqual(['0', '1', '2', '3', '4', '5'])
    view.cleanup()
  })

  it('marks the current value as an ARIA slider, and the matching row active', () => {
    const view = mount(<StarsScrollingWheel defaultValue={3} max={5} />)
    const wheel = view.wheel()

    expect(wheel.getAttribute('role')).toBe('slider')
    expect(wheel.getAttribute('aria-valuenow')).toBe('3')
    expect(wheel.getAttribute('aria-valuemin')).toBe('0')
    expect(wheel.getAttribute('aria-valuemax')).toBe('5')

    const active = view.rows().find((r) => r.hasAttribute('data-active'))
    expect(active?.getAttribute('data-value')).toBe('3')
    view.cleanup()
  })

  it('clicking a row commits its rating', () => {
    const onValueChange = vi.fn()
    const view = mount(<StarsScrollingWheel defaultValue={1} max={5} onValueChange={onValueChange} />)

    act(() => {
      view.rows()[4].click()
    })

    expect(onValueChange).toHaveBeenCalledWith(4)
    expect(view.wheel().getAttribute('aria-valuenow')).toBe('4')
    view.cleanup()
  })

  it('steps the rating with the arrow keys, and clamps at both ends', () => {
    const onValueChange = vi.fn()
    const view = mount(<StarsScrollingWheel defaultValue={0} max={5} onValueChange={onValueChange} />)
    const wheel = view.wheel()

    act(() => {
      wheel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    })
    // Already at the floor — no change, no spurious callback.
    expect(onValueChange).not.toHaveBeenCalled()

    act(() => {
      wheel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    })
    expect(onValueChange).toHaveBeenLastCalledWith(1)

    act(() => {
      wheel.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
    })
    expect(onValueChange).toHaveBeenLastCalledWith(5)

    act(() => {
      wheel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    })
    // Already at the ceiling — still 5, and no extra call past End's.
    expect(onValueChange).toHaveBeenLastCalledWith(5)

    act(() => {
      wheel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    })
    expect(onValueChange).toHaveBeenLastCalledWith(0)

    view.cleanup()
  })

  it('changes the rating on a wheel scroll', () => {
    const onValueChange = vi.fn()
    const view = mount(<StarsScrollingWheel defaultValue={2} max={5} onValueChange={onValueChange} />)

    act(() => {
      view.wheel().dispatchEvent(new WheelEvent('wheel', { deltaY: 10, bubbles: true, cancelable: true }))
    })
    expect(onValueChange).toHaveBeenLastCalledWith(3)

    act(() => {
      view.wheel().dispatchEvent(new WheelEvent('wheel', { deltaY: -10, bubbles: true, cancelable: true }))
    })
    expect(onValueChange).toHaveBeenLastCalledWith(2)

    view.cleanup()
  })

  it('ignores clicks, keys and wheel scrolls once disabled', () => {
    const onValueChange = vi.fn()
    const view = mount(
      <StarsScrollingWheel defaultValue={2} max={5} disabled onValueChange={onValueChange} />,
    )
    const wheel = view.wheel()

    expect(wheel.getAttribute('aria-disabled')).toBe('true')
    expect(wheel.getAttribute('tabindex')).toBe('-1')

    act(() => {
      view.rows()[4].click()
      wheel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
      wheel.dispatchEvent(new WheelEvent('wheel', { deltaY: 10, bubbles: true, cancelable: true }))
    })

    expect(onValueChange).not.toHaveBeenCalled()
    view.cleanup()
  })

  it('is a controlled component when value is passed', () => {
    const onValueChange = vi.fn()
    const view = mount(<StarsScrollingWheel value={1} max={5} onValueChange={onValueChange} />)

    act(() => {
      view.rows()[4].click()
    })

    // The callback fires, but the DOM does not move on its own — the caller
    // owns the value and must feed it back in.
    expect(onValueChange).toHaveBeenCalledWith(4)
    expect(view.wheel().getAttribute('aria-valuenow')).toBe('1')
    view.cleanup()
  })

  it('rounds a fractional rating down to whole rows when step is 1', () => {
    const onValueChange = vi.fn()
    const view = mount(<StarsScrollingWheel defaultValue={0} max={3} onValueChange={onValueChange} />)

    expect(view.rows()).toHaveLength(4)
    view.cleanup()
  })

  it('draws a half-star row at step 0.5', () => {
    const view = mount(<StarsScrollingWheel max={2} step={0.5} defaultValue={0} />)
    const rows = view.rows()

    expect(rows.map((r) => r.getAttribute('data-value'))).toEqual(['0', '0.5', '1', '1.5', '2'])
    view.cleanup()
  })

  it('marks its orientation for both axes', () => {
    expect(html(<StarsScrollingWheel />)).toContain('data-orientation="vertical"')
    expect(html(<StarsScrollingWheel orientation="horizontal" />)).toContain(
      'data-orientation="horizontal"',
    )
  })
})
