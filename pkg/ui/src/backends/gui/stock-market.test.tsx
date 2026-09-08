// @vitest-environment jsdom

/**
 * StockMarket is `MarketOverview` (see `./crypto-market.test.tsx` for the
 * widget's own contract) with its default tab turned to indices, so this file
 * asserts only that turn: the default preset, that other presets and a
 * spelled-out tab still resolve, and that a caller's own `tabs` overrides the
 * default rather than being merged with it.
 */
import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { StockMarket } from './stock-market'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

const frame = (markup: string) => markup.match(/<iframe [^>]*>/)?.[0] ?? ''

const EMBED = 'https://www.tradingview-widget.com/embed-widget/market-overview/?locale='

const settings = (markup: string): Record<string, unknown> => {
  const src = frame(markup).match(/src="([^"]+)"/)?.[1] ?? ''
  expect(src.startsWith(EMBED)).toBe(true)
  return JSON.parse(decodeURIComponent(src.slice(src.indexOf('#') + 1)))
}

const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  return {
    iframe: () => host.querySelector('iframe'),
    render: (next: React.ReactNode) => act(() => root.render(wrap(next))),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('StockMarket', () => {
  it('opens on the indices preset by default', () => {
    const markup = html(<StockMarket />)
    const result = settings(markup)

    expect((result.tabs as { title: string }[]).map((t) => t.title)).toEqual(['Indices'])
    expect(result.tabs).toEqual([
      expect.objectContaining({
        title: 'Indices',
        symbols: expect.arrayContaining([{ s: 'FOREXCOM:SPXUSD', d: 'S&P 500 Index' }]),
      }),
    ])
    expect(frame(markup)).toContain('title="Indices market overview"')
    expect(tag(markup, 'market-overview')).toContain('data-tabs="Indices"')
  })

  it('is one iframe inside the shared market-overview frame', () => {
    const markup = html(<StockMarket />)
    expect(markup.match(/<iframe /g)).toHaveLength(1)
    expect(tag(markup, 'market-overview').startsWith('<div')).toBe(true)
  })

  it('lets a caller replace the default tabs entirely', () => {
    const result = settings(html(<StockMarket tabs={['futures', 'bonds']} />))
    expect((result.tabs as { title: string }[]).map((t) => t.title)).toEqual(['Futures', 'Bonds'])
  })

  it('accepts a spelled-out tab alongside the indices preset', () => {
    const custom = { title: 'Watchlist', symbols: [{ s: 'NASDAQ:AAPL', d: 'Apple' }] }
    const result = settings(html(<StockMarket tabs={['indices', custom]} />))
    expect(result.tabs).toEqual([
      expect.objectContaining({ title: 'Indices' }),
      custom,
    ])
  })

  it('writes colorTheme, dateRange and size the same way MarketOverview does', () => {
    const markup = html(<StockMarket colorTheme="light" dateRange="1M" width={640} height={400} />)
    expect(settings(markup)).toMatchObject({
      colorTheme: 'light',
      dateRange: '1M',
      width: 640,
      height: 400,
      backgroundColor: '#ffffff',
    })
  })

  it('mounts a new iframe when tabs change away from the indices default', () => {
    const view = mount(<StockMarket />)
    const first = view.iframe()
    expect(first?.src).toContain(encodeURIComponent('"Indices"'))

    view.render(<StockMarket tabs={['crypto']} />)
    const second = view.iframe()
    expect(second).not.toBe(first)
    expect(second?.title).toBe('Crypto market overview')

    view.cleanup()
  })
})
