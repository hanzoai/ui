// @vitest-environment jsdom

/**
 * The ColorPicker's live behaviour — a click opens the panel, dragging the
 * saturation square or the hue bar changes the reported color, and editing the
 * hex field does the same. Portalled content does not reach static markup (the
 * same reason `dialog.test.tsx` and `popover.test.tsx` mount live), so every
 * assertion here is against a real DOM tree.
 *
 * Imports `./color-picker` directly rather than the backend barrel: a test for
 * one component should not fail because a different one's dependency moved.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { ColorPicker } from './color-picker'

let root: Root | null = null
let host: HTMLDivElement | null = null

const mount = (ui: React.ReactNode) => {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => {
    root!.render(
      <GuiProvider config={config} defaultTheme="dark">
        {ui}
      </GuiProvider>,
    )
  })
}

afterEach(() => {
  act(() => root?.unmount())
  host?.remove()
  root = null
  host = null
})

const q = (s: string) => document.querySelector(s) as HTMLElement | null

const open = () => {
  const trigger = host!.querySelector('[data-slot="button"]') as HTMLElement
  act(() => trigger.click())
}

/** Stubs a fixed layout box so a synthetic clientX/clientY lands at a known 0..1 point. */
const rect = (el: HTMLElement, width: number, height: number) =>
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: width,
    bottom: height,
    width,
    height,
    toJSON: () => ({}),
  })

const pointerDown = (el: HTMLElement, x: number, y: number) =>
  el.dispatchEvent(
    new MouseEvent('pointerdown', { bubbles: true, cancelable: true, clientX: x, clientY: y }),
  )

/** React tracks a controlled input's value through its own setter; a plain
 *  `input.value = …` is invisible to it, so typing has to go through the
 *  native setter the way a real keystroke would. */
const type = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
  setter.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('ColorPicker', () => {
  it('shows the swatch and the hex value on the closed trigger', () => {
    mount(<ColorPicker value="#ff0000" />)
    const swatch = q('[data-slot="color-picker-swatch"]')
    expect(swatch).not.toBeNull()
    expect(getComputedStyle(swatch!).backgroundColor).toBe('rgb(255, 0, 0)')
    expect(host!.textContent).toContain('#ff0000')
  })

  it('opens the panel on a trigger click', () => {
    mount(<ColorPicker value="#ff0000" />)
    expect(q('[data-slot="color-picker-saturation"]')).toBeNull()
    open()
    expect(q('[data-slot="color-picker-saturation"]')).not.toBeNull()
    expect(q('[data-slot="color-picker-hue"]')).not.toBeNull()
  })

  it('reports a color change when the hue bar is dragged, and the trigger reflects it', () => {
    const onChange = vi.fn()
    mount(<ColorPicker value="#ff0000" onChange={onChange} />)
    open()
    const hue = q('[data-slot="color-picker-hue"]')!
    rect(hue, 200, 16)
    // A third of the way across the strip lands in green territory (hue ~120).
    act(() => pointerDown(hue, 67, 8))
    expect(onChange).toHaveBeenCalled()
    const reported = onChange.mock.calls.at(-1)![0] as string
    expect(reported).toMatch(/^#[0-9a-f]{6}$/)
    expect(reported).not.toBe('#ff0000')
    expect(host!.textContent).toContain(reported)
  })

  it('reports a color change when the saturation square is dragged', () => {
    const onChange = vi.fn()
    mount(<ColorPicker value="#ff0000" onChange={onChange} />)
    open()
    const field = q('[data-slot="color-picker-saturation"]')!
    rect(field, 200, 200)
    // Top-left corner of the square is full saturation, full value — unchanged
    // for pure red, so drive it toward the corner that desaturates instead.
    act(() => pointerDown(field, 0, 0))
    expect(onChange).toHaveBeenCalledWith('#ffffff')
  })

  it('accepts a typed hex value and rejects a malformed one', () => {
    const onChange = vi.fn()
    mount(<ColorPicker value="#ff0000" onChange={onChange} />)
    open()
    const input = q('[data-slot="color-picker-hex-input"]') as HTMLInputElement
    expect(input).not.toBeNull()

    act(() => type(input, '#00ff00'))
    expect(onChange).toHaveBeenCalledWith('#00ff00')

    onChange.mockClear()
    act(() => type(input, 'not-a-color'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('sets the color from a preset swatch in one click', () => {
    const onChange = vi.fn()
    mount(<ColorPicker value="#ff0000" onChange={onChange} presets={['#0000ff', '#00ff00']} />)
    open()
    const presets = document.querySelectorAll('[data-slot="color-picker-preset"]')
    expect(presets).toHaveLength(2)
    act(() => (presets[0] as HTMLElement).click())
    expect(onChange).toHaveBeenCalledWith('#0000ff')
  })

  it('disables the trigger while disabled', () => {
    mount(<ColorPicker value="#ff0000" disabled presets={['#0000ff']} />)
    const trigger = host!.querySelector('[data-slot="button"]') as HTMLButtonElement
    expect(trigger.getAttribute('aria-disabled')).toBe('true')
  })
})
