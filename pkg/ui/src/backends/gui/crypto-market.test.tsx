// @vitest-environment jsdom

/**
 * The table is TradingView's document, so the whole contract is the address it
 * is opened at: every documented prop has to arrive in the iframe's `src` under
 * the name TradingView reads, presets resolve to their symbol groups, and a
 * changed prop has to reach a NEW iframe — a fragment-only change to `src` is a
 * same-document navigation the widget never sees. Asserted on the server
 * markup for the address and on a live tree for the remount.
 */
import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { MarketOverview } from './crypto-market'

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

/** The settings TradingView will read, decoded from the iframe's address. */
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
    host,
    render: (next: React.ReactNode) => act(() => root.render(wrap(next))),
    iframe: () => host.querySelector('iframe'),
    overview: () => host.querySelector<HTMLElement>('[data-slot="market-overview"]'),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('MarketOverview', () => {
  it('is a sized frame holding one TradingView iframe', () => {
    const markup = html(<MarketOverview />)
    const overview = tag(markup, 'market-overview')

    expect(overview.startsWith('<div')).toBe(true)
    expect(overview).toContain('_height-550px')
    expect(markup.match(/<iframe /g)).toHaveLength(1)
    expect(frame(markup)).toContain('title="Crypto market overview"')
    // The iframe fills the frame; the frame is what carries the size.
    expect(frame(markup)).toMatch(/style="[^"]*width:100%;height:100%/)
  })

  it('defaults to the crypto preset', () => {
    const result = settings(html(<MarketOverview />))
    expect(result).toMatchObject({
      colorTheme: 'dark',
      dateRange: '12M',
      locale: 'en',
      width: '100%',
      height: 550,
      showSymbolLogo: true,
      showChart: true,
    })
    expect(result.tabs).toEqual([
      expect.objectContaining({
        title: 'Crypto',
        symbols: expect.arrayContaining([{ s: 'BINANCE:BTCUSDT', d: 'Bitcoin' }]),
      }),
    ])
  })

  it('resolves every built-in preset by name', () => {
    const result = settings(
      html(<MarketOverview tabs={['indices', 'futures', 'bonds', 'forex']} />),
    )
    expect((result.tabs as { title: string }[]).map((t) => t.title)).toEqual([
      'Indices',
      'Futures',
      'Bonds',
      'Forex',
    ])
  })

  it('accepts a spelled-out custom tab alongside presets', () => {
    const custom = { title: 'Watchlist', symbols: [{ s: 'NASDAQ:AAPL', d: 'Apple' }] }
    const result = settings(html(<MarketOverview tabs={['crypto', custom]} />))
    expect(result.tabs).toEqual([
      expect.objectContaining({ title: 'Crypto' }),
      custom,
    ])
  })

  it('writes every prop under the name TradingView reads', () => {
    const markup = html(
      <MarketOverview
        colorTheme="light"
        dateRange="1M"
        locale="ja"
        isTransparent
        showFloatingTooltip
        showSymbolLogo={false}
        showChart={false}
        width={640}
        height={400}
      />,
    )

    expect(settings(markup)).toMatchObject({
      colorTheme: 'light',
      dateRange: '1M',
      locale: 'ja',
      isTransparent: true,
      showFloatingTooltip: true,
      showSymbolLogo: false,
      showChart: false,
      width: 640,
      height: 400,
      backgroundColor: '#ffffff',
    })
    const overview = tag(markup, 'market-overview')
    expect(overview).toContain('data-color-theme="light"')
    expect(overview).toContain('_width-640px')
    expect(overview).toContain('_height-400px')
  })

  // `colorTheme` is the TABLE's palette. gui's stack takes a `theme` of its
  // own, and letting ours fall through would re-theme the frame — and
  // whatever a caller nests in it — to a gui theme that happens to share the
  // name. Nor may it land as `data-theme`: that attribute is what page
  // stylesheets select a theme by, and a light table in a dark app would flip
  // the frame's tokens.
  it('keeps the table theme off the gui frame, and passes frame props through', () => {
    const markup = html(<MarketOverview colorTheme="light" rounded="$3" />)

    expect(markup.replace(/<style[\s\S]*?<\/style>/g, '')).not.toContain('t_light')
    expect(tag(markup, 'market-overview')).not.toContain('data-theme')
    expect(tag(markup, 'market-overview')).toContain('_btlr-c-radius-3')
  })

  it('mounts a new iframe when the tabs change, and keeps it when nothing does', () => {
    const view = mount(<MarketOverview tabs={['crypto']} />)
    const first = view.iframe()
    expect(first?.src).toContain(encodeURIComponent('"Crypto"'))

    view.render(<MarketOverview tabs={['crypto']} />)
    expect(view.iframe()).toBe(first)

    view.render(<MarketOverview tabs={['forex']} />)
    const second = view.iframe()
    expect(second).not.toBe(first)
    expect(second?.title).toBe('Forex market overview')
    expect(view.overview()?.dataset.tabs).toBe('Forex')

    view.cleanup()
  })
})
