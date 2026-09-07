// @vitest-environment jsdom

/**
 * The Calendar on a live DOM: the month arithmetic that lays the grid out, the
 * value each mode hands `onSelect`, the markers a pick leaves on the days, the
 * month controls in both the controlled and uncontrolled shapes, and the
 * keyboard — one tab stop, and the arrow, Home/End and Page keys moving focus
 * by day, week and month, paging the view when the target is off it.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Calendar } from './calendar'
import type { CalendarRange } from './calendar'

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
  const all = () => [...host.querySelectorAll<HTMLElement>('[data-slot="calendar-day"]')]
  return {
    host,
    days: all,
    /** The day of the shown month, never an outside one. */
    day: (n: number) => all().find((el) => !el.hasAttribute('data-outside') && el.textContent === String(n))!,
    caption: () => host.querySelector('[data-slot="calendar-caption-label"]')?.textContent,
    stops: () => all().filter((el) => el.getAttribute('tabindex') === '0'),
    rerender: (next: React.ReactNode) => act(() => root.render(wrap(next))),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const press = (el: Element | null, key: string) =>
  act(() => {
    el?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  })

const active = () => document.activeElement as HTMLElement

// September 2026: 30 days, the 1st a Tuesday, so two leading and three
// trailing outside days make five whole weeks.
const SEPT = new Date(2026, 8, 1)
const d = (n: number, month = 8) => new Date(2026, month, n)

describe('Calendar', () => {
  it('lays the month out in whole weeks with the neighbouring days at the ends', () => {
    const view = mount(<Calendar month={SEPT} />)

    expect(view.caption()).toBe('September 2026')
    expect(view.days()).toHaveLength(35)
    expect(view.days().slice(0, 3).map((el) => el.dataset.date)).toEqual(['2026-8-30', '2026-8-31', '2026-9-1'])
    expect(view.days().slice(-3).map((el) => el.dataset.date)).toEqual(['2026-10-1', '2026-10-2', '2026-10-3'])
    expect(view.days().filter((el) => el.hasAttribute('data-outside'))).toHaveLength(5)
    // The week header rides the same seven-column grid as the days.
    const grid = view.host.querySelector('[data-slot="grid"]')!
    expect(grid.getAttribute('style')).toContain('repeat(7, minmax(0, 1fr))')
    expect([...grid.querySelectorAll('[data-slot="grid-cell"]')].slice(0, 7).map((c) => c.textContent))
      .toEqual(['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'])
    view.cleanup()
  })

  it('starts the week on the day asked for', () => {
    const view = mount(<Calendar month={SEPT} weekStartsOn={1} />)

    const grid = view.host.querySelector('[data-slot="grid"]')!
    expect([...grid.querySelectorAll('[data-slot="grid-cell"]')].slice(0, 7).map((c) => c.textContent))
      .toEqual(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'])
    expect(view.days()[0].dataset.date).toBe('2026-8-31')
    expect(view.days().at(-1)!.dataset.date).toBe('2026-10-4')
    view.cleanup()
  })

  it('showOutsideDays=false keeps the cells and empties them', () => {
    const view = mount(<Calendar month={SEPT} showOutsideDays={false} />)

    expect(view.days()).toHaveLength(30)
    expect(view.days().some((el) => el.hasAttribute('data-outside'))).toBe(false)
    expect(view.host.querySelectorAll('[data-slot="grid-cell"]')).toHaveLength(7 + 35)
    view.cleanup()
  })

  it('single: a pick hands back the day and marks it; picking it again clears', () => {
    const onSelect = vi.fn()
    const view = mount(<Calendar mode="single" month={SEPT} onSelect={onSelect} />)

    act(() => view.day(15).click())
    expect(onSelect).toHaveBeenCalledTimes(1)
    const picked = onSelect.mock.calls[0][0] as Date
    expect(picked.getTime()).toBe(d(15).getTime())

    view.rerender(<Calendar mode="single" month={SEPT} selected={picked} onSelect={onSelect} />)
    expect(view.day(15).getAttribute('data-selected')).toBe('true')
    expect(view.day(15).getAttribute('aria-selected')).toBe('true')
    expect(view.stops()).toEqual([view.day(15)])

    act(() => view.day(15).click())
    expect(onSelect).toHaveBeenLastCalledWith(undefined)
    view.cleanup()
  })

  it('single: a selected day carrying a time still marks its calendar day', () => {
    const view = mount(<Calendar mode="single" month={SEPT} selected={new Date(2026, 8, 15, 17, 30)} />)

    expect(view.day(15).getAttribute('data-selected')).toBe('true')
    view.cleanup()
  })

  it('multiple: picks accumulate and a repeated pick drops out', () => {
    let selected: Date[] | undefined
    const onSelect = vi.fn((next: Date[] | undefined) => {
      selected = next
    })
    const show = () => <Calendar mode="multiple" month={SEPT} selected={selected} onSelect={onSelect} />
    const view = mount(show())

    act(() => view.day(3).click())
    view.rerender(show())
    act(() => view.day(10).click())
    view.rerender(show())
    expect(selected?.map((x) => x.getDate())).toEqual([3, 10])
    expect(view.day(3).hasAttribute('data-selected')).toBe(true)
    expect(view.day(10).hasAttribute('data-selected')).toBe(true)

    act(() => view.day(3).click())
    expect(selected?.map((x) => x.getDate())).toEqual([10])
    view.cleanup()
  })

  it('range: picks grow the range, an end pick shrinks it to a day, and that day clears it', () => {
    let range: CalendarRange | undefined
    const onSelect = vi.fn((next: CalendarRange | undefined) => {
      range = next
    })
    const show = () => <Calendar mode="range" month={SEPT} selected={range} onSelect={onSelect} />
    const view = mount(show())

    act(() => view.day(5).click())
    expect(range).toEqual({ from: d(5), to: d(5) })

    view.rerender(show())
    act(() => view.day(12).click())
    expect(range).toEqual({ from: d(5), to: d(12) })

    view.rerender(show())
    expect(view.day(5).hasAttribute('data-range-start')).toBe(true)
    expect(view.day(12).hasAttribute('data-range-end')).toBe(true)
    expect(view.day(8).hasAttribute('data-range-middle')).toBe(true)
    expect(view.days().filter((el) => el.hasAttribute('data-selected'))).toHaveLength(8)
    expect(view.day(4).hasAttribute('data-selected')).toBe(false)

    act(() => view.day(1).click())
    expect(range).toEqual({ from: d(1), to: d(12) })

    view.rerender(show())
    act(() => view.day(12).click())
    expect(range).toEqual({ from: d(12), to: d(12) })

    view.rerender(show())
    act(() => view.day(12).click())
    expect(range).toBeUndefined()
    view.cleanup()
  })

  it('a disabled day says so and cannot be picked', () => {
    const onSelect = vi.fn()
    const view = mount(
      <Calendar mode="single" month={SEPT} onSelect={onSelect} disabled={(x) => x.getDate() === 20} />,
    )

    expect(view.day(20).getAttribute('aria-disabled')).toBe('true')
    act(() => view.day(20).click())
    expect(onSelect).not.toHaveBeenCalled()
    view.cleanup()
  })

  it('the month controls page an uncontrolled calendar and report to onMonthChange', () => {
    const onMonthChange = vi.fn()
    const view = mount(<Calendar defaultMonth={SEPT} onMonthChange={onMonthChange} />)

    act(() => view.host.querySelector<HTMLElement>('[data-slot="calendar-nav-next"]')!.click())
    expect(view.caption()).toBe('October 2026')
    expect(onMonthChange).toHaveBeenLastCalledWith(d(1, 9))

    act(() => view.host.querySelector<HTMLElement>('[data-slot="calendar-nav-previous"]')!.click())
    act(() => view.host.querySelector<HTMLElement>('[data-slot="calendar-nav-previous"]')!.click())
    expect(view.caption()).toBe('August 2026')
    expect(onMonthChange).toHaveBeenLastCalledWith(d(1, 7))
    view.cleanup()
  })

  it('a controlled month stays where its owner put it', () => {
    const onMonthChange = vi.fn()
    const view = mount(<Calendar month={SEPT} onMonthChange={onMonthChange} />)

    act(() => view.host.querySelector<HTMLElement>('[data-slot="calendar-nav-next"]')!.click())
    expect(onMonthChange).toHaveBeenCalledWith(d(1, 9))
    expect(view.caption()).toBe('September 2026')
    view.cleanup()
  })

  it('numberOfMonths lays out consecutive months with one control at each end', () => {
    const view = mount(<Calendar month={SEPT} numberOfMonths={2} />)

    const captions = [...view.host.querySelectorAll('[data-slot="calendar-caption-label"]')].map((c) => c.textContent)
    expect(captions).toEqual(['September 2026', 'October 2026'])
    const months = [...view.host.querySelectorAll('[data-slot="calendar-month"]')]
    expect(months[0].querySelector('[data-slot="calendar-nav-previous"]')).not.toBeNull()
    expect(months[0].querySelector('[data-slot="calendar-nav-next"]')).toBeNull()
    expect(months[1].querySelector('[data-slot="calendar-nav-previous"]')).toBeNull()
    expect(months[1].querySelector('[data-slot="calendar-nav-next"]')).not.toBeNull()
    view.cleanup()
  })

  it('keeps one day in the tab order: the first of the month, then whichever day was last focused', () => {
    // A month with no today in it, so the anchor is the 1st.
    const view = mount(<Calendar month={new Date(2030, 0, 1)} />)

    expect(view.stops()).toEqual([view.day(1)])

    act(() => view.day(10).focus())
    expect(view.stops()).toEqual([view.day(10)])
    view.cleanup()
  })

  it('initialFocus lands focus on the tab-stop day at mount', () => {
    const view = mount(<Calendar mode="single" month={SEPT} selected={d(15)} initialFocus />)

    expect(active()).toBe(view.day(15))
    view.cleanup()
  })

  it('moves focus by day, week, and to the ends of the week', () => {
    const view = mount(<Calendar month={SEPT} />)

    act(() => view.day(15).focus())
    press(active(), 'ArrowRight')
    expect(active()).toBe(view.day(16))
    press(active(), 'ArrowDown')
    expect(active()).toBe(view.day(23))
    press(active(), 'End')
    expect(active()).toBe(view.day(26))
    press(active(), 'Home')
    expect(active()).toBe(view.day(20))
    press(active(), 'ArrowUp')
    expect(active()).toBe(view.day(13))
    press(active(), 'ArrowLeft')
    expect(active()).toBe(view.day(12))
    view.cleanup()
  })

  it('walks onto a shown outside day, and pages the month once the target is off the grid', () => {
    const view = mount(<Calendar defaultMonth={SEPT} />)

    act(() => view.day(1).focus())
    press(active(), 'ArrowLeft')
    expect(active().dataset.date).toBe('2026-8-31')
    expect(active().hasAttribute('data-outside')).toBe(true)
    expect(view.caption()).toBe('September 2026')

    press(active(), 'ArrowUp')
    expect(view.caption()).toBe('August 2026')
    expect(active()).toBe(view.day(24))

    press(active(), 'PageDown')
    expect(view.caption()).toBe('September 2026')
    expect(active()).toBe(view.day(24))
    view.cleanup()
  })

  it('PageDown keeps the day of the month, clamped to the last one the month has', () => {
    const view = mount(<Calendar defaultMonth={new Date(2026, 0, 1)} />)

    act(() => view.day(31).focus())
    press(active(), 'PageDown')
    expect(view.caption()).toBe('February 2026')
    expect(active()).toBe(view.day(28))
    view.cleanup()
  })
})
