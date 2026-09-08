// @vitest-environment jsdom

/**
 * RelativeTime renders a real `<time dateTime>` carrying the distance in
 * words, updates itself on an interval, and offers `short` (abbreviated) and
 * `long` (Intl.RelativeTimeFormat) alternate wordings — asserted on compiled
 * markup and on a live DOM, since @hanzo/gui drops an unrecognised prop
 * silently.
 */
import { describe, expect, it, vi, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { RelativeTime } from './relative-time'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  return {
    text: () => host.querySelector('[data-slot="relative-time"]')?.textContent ?? '',
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('RelativeTime', () => {
  it('is a real <time> element carrying the ISO instant', () => {
    const date = new Date('2024-01-01T00:00:00.000Z')
    const markup = html(<RelativeTime date={date} />)
    const el = tag(markup, 'relative-time')

    expect(el.startsWith('<time')).toBe(true)
    expect(el).toContain('dateTime="2024-01-01T00:00:00.000Z"')
  })

  it('reads the auto format as words', () => {
    const anHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const markup = html(<RelativeTime date={anHourAgo} />)

    expect(markup).toContain('1 hour ago')
    expect(tag(markup, 'relative-time')).toContain('data-format="auto"')
  })

  it('says "just now" for a moment in the very recent past', () => {
    const markup = html(<RelativeTime date={new Date()} />)
    expect(markup).toContain('just now')
  })

  it('abbreviates in the short format', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400 * 1000)
    const markup = html(<RelativeTime date={threeDaysAgo} format="short" />)

    expect(markup).toContain('>3d<')
    expect(tag(markup, 'relative-time')).toContain('data-format="short"')
  })

  it('phrases the long format through Intl.RelativeTimeFormat', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000)
    const markup = html(<RelativeTime date={twoHoursAgo} format="long" />)

    expect(markup).toContain('2 hours ago')
    expect(tag(markup, 'relative-time')).toContain('data-format="long"')
  })

  it('reads a future date as "in" rather than "ago"', () => {
    const inTwoHours = new Date(Date.now() + 2 * 3600 * 1000)
    const markup = html(<RelativeTime date={inTwoHours} />)

    expect(markup).toContain('in 2 hours')
  })

  it('marks a future date in the short format too, not just an unsigned magnitude', () => {
    const inThreeHours = new Date(Date.now() + 3 * 3600 * 1000)
    const markup = html(<RelativeTime date={inThreeHours} format="short" />)

    expect(markup).toContain('>in 3h<')
  })

  it('updates itself once updateInterval elapses', () => {
    vi.useFakeTimers()
    const start = new Date('2024-06-01T12:00:00.000Z')
    vi.setSystemTime(start)

    const view = mount(<RelativeTime date={start} updateInterval={1000} />)
    expect(view.text()).toBe('just now')

    act(() => {
      vi.setSystemTime(new Date(start.getTime() + 61 * 1000))
      vi.advanceTimersByTime(1000)
    })

    expect(view.text()).toBe('1 minute ago')
    view.cleanup()
  })

  it('forwards unknown DOM props, e.g. an id', () => {
    const el = tag(html(<RelativeTime date={new Date()} id="posted-at" />), 'relative-time')
    expect(el).toContain('id="posted-at"')
  })
})
