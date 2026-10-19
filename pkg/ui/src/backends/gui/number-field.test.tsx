// @vitest-environment jsdom

/**
 * NumberField: the text is the reader's, the value is a number.
 *
 * Parsing is asserted as a pure function across three locales; the field is
 * asserted in a live DOM, because what it promises is behaviour — typing, the
 * keys a spinbutton answers, the clamp and the reformat on blur.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { audit } from '../../../test/axe'
import { NumberField, parseNumber } from './number-field'

describe('parseNumber', () => {
  it.each([
    ['1,234.5', 'en-US', 1234.5],
    ['1.234,5', 'de-DE', 1234.5],
    ['1 234,5', 'fr-FR', 1234.5],
    ['1 234,5', 'fr-FR', 1234.5],
    ['−5', 'en-US', -5],
    ['-0.25', 'en-US', -0.25],
    ['€1.234,50', 'de-DE', 1234.5],
    ['.5', 'en-US', 0.5],
  ] as const)('%s in %s reads as %d', (text, locale, n) => {
    expect(parseNumber(text, locale)).toBe(n)
  })

  it('a percent format reads the written percentage back as a fraction', () => {
    expect(parseNumber('12%', 'en-US', { style: 'percent' })).toBeCloseTo(0.12)
  })

  it.each(['', 'abc', '1-2', '--3'])('%j is not a number', (text) => {
    expect(Number.isNaN(parseNumber(text, 'en-US'))).toBe(true)
  })
})

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

const input = () => host.querySelector<HTMLInputElement>('input')!

/** Type `text` the way React hears it: the native setter, then an input event. */
const type = (text: string) =>
  act(() => {
    const el = input()
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, text)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })

const key = (k: string, mods: KeyboardEventInit = {}) =>
  act(() => {
    input().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...mods }))
  })

describe('NumberField', () => {
  it('writes the value in the locale, and is a spinbutton over its range', () => {
    mount(<NumberField locale="de-DE" defaultValue={1234.5} min={0} max={10000} aria-label="Amount" />)
    expect(input().value).toBe('1.234,5')
    expect(input().getAttribute('role')).toBe('spinbutton')
    expect(input().getAttribute('aria-valuenow')).toBe('1234.5')
    expect(input().getAttribute('aria-valuemax')).toBe('10000')
  })

  it('reports every number the text reads as while typing', () => {
    const onValueChange = vi.fn()
    mount(<NumberField locale="en-US" aria-label="Amount" onValueChange={onValueChange} />)
    act(() => input().focus())
    type('1,2')
    type('1,25')
    type('1,25x')
    expect(onValueChange.mock.calls.map((c) => c[0])).toEqual([12, 125])
    type('')
    expect(onValueChange).toHaveBeenLastCalledWith(null)
  })

  it('clamps and reformats on blur', () => {
    const onValueChange = vi.fn()
    mount(<NumberField locale="en-US" max={100} aria-label="Percent" onValueChange={onValueChange} />)
    act(() => input().focus())
    type('2500')
    act(() => input().blur())
    expect(onValueChange).toHaveBeenLastCalledWith(100)
    expect(input().value).toBe('100')
  })

  it('allowOutOfRange keeps a number outside the range', () => {
    const onValueChange = vi.fn()
    mount(<NumberField locale="en-US" max={100} allowOutOfRange aria-label="x" onValueChange={onValueChange} />)
    act(() => input().focus())
    type('2500')
    act(() => input().blur())
    expect(onValueChange).toHaveBeenLastCalledWith(2500)
  })

  it('ArrowUp/Down step; Shift is the large step, Alt the small one; Home/End are the bounds', () => {
    const onValueChange = vi.fn()
    mount(<NumberField locale="en-US" defaultValue={0.2} min={0} max={50} aria-label="x" onValueChange={onValueChange} />)
    key('ArrowUp')
    key('ArrowUp', { altKey: true })
    key('ArrowDown', { shiftKey: true })
    key('End')
    key('Home')
    // 0.2 + 1, + 0.1 (no float residue), - 10 clamps at 0, then 50, then 0.
    expect(onValueChange.mock.calls.map((c) => c[0])).toEqual([1.2, 1.3, 0, 50, 0])
  })

  it('readOnly refuses steps', () => {
    const onValueChange = vi.fn()
    mount(<NumberField readOnly defaultValue={3} aria-label="x" onValueChange={onValueChange} buttons />)
    key('ArrowUp')
    act(() => host.querySelector<HTMLElement>('[data-slot="number-field-increment"]')!.click())
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('the buttons step, stop at the bounds, and stay out of the tab order', () => {
    const onValueChange = vi.fn()
    mount(<NumberField defaultValue={9} max={10} aria-label="Seats" onValueChange={onValueChange} buttons />)
    const plus = host.querySelector<HTMLElement>('[data-slot="number-field-increment"]')!
    const minus = host.querySelector<HTMLElement>('[data-slot="number-field-decrement"]')!
    expect(plus.getAttribute('tabindex')).toBe('-1')
    expect(minus.getAttribute('aria-label')).toBe('Decrease')
    act(() => plus.click())
    expect(onValueChange).toHaveBeenLastCalledWith(10)
    expect(plus.hasAttribute('disabled') || plus.getAttribute('aria-disabled') === 'true').toBe(true)
  })

  it('a controlled field shows the value it is given', () => {
    mount(<NumberField value={42} locale="en-US" aria-label="x" />)
    expect(input().value).toBe('42')
    mount(<NumberField value={null} locale="en-US" aria-label="x" />)
    expect(input().value).toBe('')
  })

  it('passes axe, with and without buttons', async () => {
    mount(
      <>
        <NumberField aria-label="Amount" defaultValue={1} />
        <NumberField aria-label="Seats" defaultValue={2} buttons />
      </>,
    )
    expect(await audit(host)).toEqual([])
  })
})
