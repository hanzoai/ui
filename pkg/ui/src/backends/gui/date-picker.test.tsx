// @vitest-environment jsdom

/**
 * The DatePicker's SELECTION contract: the trigger shows the placeholder until
 * a pick is made, then the formatted date (or range); opening the popover
 * exposes the calendar; a click on a day picks it, closing a single picker and
 * leaving a range picker open until both ends are set; a preset picks a date
 * directly from the trigger's own panel.
 *
 * Asserted on a live DOM — the popover panel is portalled and never reaches
 * static markup, so opening it and clicking inside are the only places this
 * component does anything observable.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { DatePicker } from './date-picker'

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
    trigger: () => host.querySelector<HTMLElement>('[data-slot="date-picker-trigger"]')!,
    days: () => [...document.querySelectorAll<HTMLElement>('[data-slot="calendar-day"]')],
    day: (n: number) =>
      [...document.querySelectorAll<HTMLElement>('[data-slot="calendar-day"]')].find(
        (el) => !el.hasAttribute('data-outside') && el.textContent === String(n),
      )!,
    presetTrigger: () => document.querySelector<HTMLElement>('[data-slot="date-picker-preset-trigger"]'),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('DatePicker (single)', () => {
  it('shows the placeholder with nothing picked', () => {
    const view = mount(<DatePicker placeholder="Pick a date" />)

    expect(view.trigger().textContent).toContain('Pick a date')
    expect(view.trigger().getAttribute('data-empty')).toBe('true')
    view.cleanup()
  })

  it('shows the formatted value when given one', () => {
    const view = mount(<DatePicker selected={new Date(2022, 0, 20)} />)

    expect(view.trigger().textContent).toContain('Jan 20, 2022')
    expect(view.trigger().hasAttribute('data-empty')).toBe(false)
    view.cleanup()
  })

  it('opens the calendar on click and reveals its days', () => {
    const view = mount(<DatePicker />)

    act(() => view.trigger().click())

    expect(view.days().length).toBeGreaterThan(0)
    view.cleanup()
  })

  it('picking a day reports it, updates the trigger, and closes the popover', () => {
    const onSelect = vi.fn()
    const view = mount(<DatePicker onSelect={onSelect} />)

    act(() => view.trigger().click())
    act(() => view.day(15).click())

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect((onSelect.mock.calls[0][0] as Date).getDate()).toBe(15)
    expect(view.trigger().hasAttribute('data-empty')).toBe(false)
    expect(view.days()).toHaveLength(0)
    view.cleanup()
  })

  it('is uncontrolled when unselected: an initial pick still lands and later picks replace it', () => {
    const view = mount(<DatePicker />)

    act(() => view.trigger().click())
    act(() => view.day(20).click())
    expect(view.trigger().textContent).not.toContain('Pick a date')

    act(() => view.trigger().click())
    act(() => view.day(15).click())
    expect(view.trigger().hasAttribute('data-empty')).toBe(false)
    view.cleanup()
  })

  it('offers presets in the trigger panel', () => {
    const view = mount(
      <DatePicker presets={[{ label: 'Today', days: 0 }, { label: 'In a week', days: 7 }]} />,
    )

    act(() => view.trigger().click())
    expect(view.presetTrigger()).toBeTruthy()
    view.cleanup()
  })
})

describe('DatePicker (range)', () => {
  it('shows a single formatted date until the range has two ends', () => {
    const view = mount(<DatePicker mode="range" selected={{ from: new Date(2022, 0, 20) }} />)

    expect(view.trigger().textContent).toContain('Jan 20, 2022')
    expect(view.trigger().textContent).not.toContain('-')
    view.cleanup()
  })

  it('shows both ends once the range is closed', () => {
    const view = mount(
      <DatePicker mode="range" selected={{ from: new Date(2022, 0, 20), to: new Date(2022, 0, 25) }} />,
    )

    expect(view.trigger().textContent).toContain('Jan 20, 2022')
    expect(view.trigger().textContent).toContain('Jan 25, 2022')
    view.cleanup()
  })

  it('stays open after the first click of a range pick', () => {
    const onSelect = vi.fn()
    const view = mount(<DatePicker mode="range" onSelect={onSelect} />)

    act(() => view.trigger().click())
    act(() => view.day(10).click())

    expect(onSelect).toHaveBeenCalledWith({ from: expect.any(Date), to: expect.any(Date) })
    expect(view.days().length).toBeGreaterThan(0)
    view.cleanup()
  })
})
