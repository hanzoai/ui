// @vitest-environment jsdom

/**
 * MiniCalendar on a live DOM: it frames one month, hides outside days, hands
 * a pick straight to `onSelect`, and a repeated press on the selected day is
 * a no-op rather than a clear.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { MiniCalendar } from './mini-calendar'

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
  const all = () => [...host.querySelectorAll<HTMLElement>('[data-slot="calendar-day"]')]
  return {
    host,
    days: all,
    day: (n: number) => all().find((el) => !el.hasAttribute('data-outside') && el.textContent === String(n))!,
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

// September 2026: the 1st is a Tuesday, so a real month has leading/trailing
// outside days that this component must never render.
const SEPT = new Date(2026, 8, 1)

describe('MiniCalendar', () => {
  it('frames a single month', () => {
    const markup = html(<MiniCalendar month={SEPT} />)

    expect(markup).toContain('data-slot="mini-calendar"')
    expect(markup).toContain('data-slot="calendar"')
    // one caption for one month, never a second
    expect([...markup.matchAll(/data-slot="calendar-caption-label"/g)]).toHaveLength(1)
  })

  it('never shows an outside day', () => {
    const markup = html(<MiniCalendar month={SEPT} />)

    expect(markup).not.toContain('data-outside')
  })

  it('hands the pressed day to onSelect', () => {
    const onSelect = vi.fn()
    const view = mount(<MiniCalendar month={SEPT} onSelect={onSelect} />)

    act(() => view.day(15).click())

    expect(onSelect).toHaveBeenCalledTimes(1)
    const got = onSelect.mock.calls[0][0] as Date
    expect(got.getDate()).toBe(15)
    expect(got.getMonth()).toBe(8)
    view.cleanup()
  })

  it('leaves the selected day picked when it is pressed again, rather than clearing it', () => {
    const onSelect = vi.fn()
    const view = mount(<MiniCalendar month={SEPT} selected={new Date(2026, 8, 15)} onSelect={onSelect} />)

    act(() => view.day(15).click())

    expect(onSelect).not.toHaveBeenCalled()
    expect(view.day(15).getAttribute('data-selected')).toBe('true')
    view.cleanup()
  })

  it('marks the selected day and paints the rest as ordinary picks', () => {
    const view = mount(<MiniCalendar month={SEPT} selected={new Date(2026, 8, 15)} />)

    expect(view.day(15).getAttribute('data-selected')).toBe('true')
    expect(view.day(3).getAttribute('data-selected')).toBeNull()
    view.cleanup()
  })

  it('changes month through the calendar nav and reports it', () => {
    const onMonthChange = vi.fn()
    const view = mount(<MiniCalendar month={SEPT} onMonthChange={onMonthChange} />)
    const next = view.host.querySelector<HTMLElement>('[data-slot="calendar-nav-next"]')!

    act(() => next.click())

    expect(onMonthChange).toHaveBeenCalledTimes(1)
    const got = onMonthChange.mock.calls[0][0] as Date
    expect(got.getMonth()).toBe(9)
    view.cleanup()
  })
})
