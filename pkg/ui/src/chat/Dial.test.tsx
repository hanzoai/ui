// @vitest-environment jsdom

/**
 * The effort dial: one small icon button naming the level, a list on a press, the
 * level moved by dragging along the icon or by the arrows, a label while held.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { Dial } from './Dial'
import { EFFORTS } from './ways'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

const mount = (ui: React.ReactNode) =>
  act(() => {
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        {ui}
      </GuiProvider>,
    )
  })

const button = () => host.querySelector<HTMLElement>('[data-slot="dial-button"]')!
const items = EFFORTS.filter((e) => ['auto', 'high', 'xhigh', 'max'].includes(e.id))
const pointer = (type: string, x: number) =>
  act(() => {
    const ev = new MouseEvent(type, { clientX: x, bubbles: true, cancelable: true })
    ;(ev as unknown as { pointerId: number }).pointerId = 1
    button().dispatchEvent(ev)
  })
const key = (k: string) =>
  act(() => {
    button().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
  })

describe('Dial', () => {
  it('is one labelled icon button with the level in a pip', () => {
    mount(<Dial effort={{ value: 'high', set: () => {}, items }} />)
    expect(button().getAttribute('aria-label')).toBe('Effort: High')
    expect(host.querySelector('[data-slot="dial-pip"]')?.textContent).toBe('H')
    expect(button().textContent).toBe('H')
  })

  it('on a phone stands the level beside the gauge, in the row, not over its corner', () => {
    mount(<Dial narrow size={36} effort={{ value: 'max', set: () => {}, items }} />)
    const pip = () => host.querySelector('[data-slot="dial-pip"]')!
    expect(pip().textContent).toBe('MAX')
    expect(pip().className).not.toContain('_pos-absolute')
    expect(button().className).toContain('_height-36px')
    expect(button().className).toContain('_minW-36px')
    mount(<Dial size={32} effort={{ value: 'max', set: () => {}, items }} />)
    expect(pip().className).toContain('_pos-absolute')
    expect(button().className).toContain('_width-32px')
  })

  it('opens its list on a press and picks from it', () => {
    const set = vi.fn()
    mount(<Dial effort={{ value: 'auto', set, items }} />)
    pointer('pointerdown', 100)
    pointer('pointerup', 100)
    const rows = [...document.querySelectorAll<HTMLElement>('[role="option"]')]
    expect(rows).toHaveLength(4)
    act(() => rows[3]!.click())
    expect(set).toHaveBeenCalledWith('max')
  })

  it('moves a level for each step of a drag, names it while held, and keeps it on release', () => {
    const set = vi.fn()
    mount(<Dial effort={{ value: 'auto', set, items }} />)
    pointer('pointerdown', 100)
    pointer('pointermove', 100 + 22 * 2)
    expect(host.querySelector('[data-slot="dial-tip"]')?.textContent).toBe('XHigh')
    pointer('pointerup', 100 + 22 * 2)
    expect(set).toHaveBeenCalledWith('xhigh')
    expect(host.querySelector('[data-slot="dial-tip"]')).toBeNull()
    // A drag past either end stops at it, and a press that did not move opens nothing.
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(0)
  })

  it('moves a level with the arrows, and not past the ends', () => {
    const set = vi.fn()
    mount(<Dial effort={{ value: 'high', set, items }} />)
    key('ArrowRight')
    expect(set).toHaveBeenLastCalledWith('xhigh')
    key('ArrowLeft')
    expect(set).toHaveBeenLastCalledWith('auto')
    mount(<Dial effort={{ value: 'max', set, items }} />)
    set.mockClear()
    key('ArrowUp')
    expect(set).not.toHaveBeenCalled()
  })
})
