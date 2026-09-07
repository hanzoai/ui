// @vitest-environment jsdom

/**
 * The chart is TradingView's document, so the whole contract is the address it
 * is opened at: every documented prop has to arrive in the iframe's `src` under
 * the name TradingView reads, and a changed prop has to reach a NEW iframe —
 * a fragment-only change to `src` is a same-document navigation the widget
 * never sees. Asserted on the server markup for the address and on a live tree
 * for the remount.
 */
import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { AdvancedChart } from './advanced-chart'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

const frame = (markup: string) => markup.match(/<iframe [^>]*>/)?.[0] ?? ''

const EMBED = 'https://www.tradingview-widget.com/embed-widget/advanced-chart/?locale=en#'

/** The settings TradingView will read, decoded from the iframe's address. */
const settings = (markup: string): Record<string, unknown> => {
  const src = frame(markup).match(/src="([^"]+)"/)?.[1] ?? ''
  expect(src.startsWith(EMBED)).toBe(true)
  return JSON.parse(decodeURIComponent(src.slice(EMBED.length)))
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
    chart: () => host.querySelector<HTMLElement>('[data-slot="advanced-chart"]'),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('AdvancedChart', () => {
  it('is a sized frame holding one TradingView iframe', () => {
    const markup = html(<AdvancedChart />)
    const chart = tag(markup, 'advanced-chart')

    expect(chart.startsWith('<div')).toBe(true)
    expect(chart).toContain('_height-500px')
    expect(markup.match(/<iframe /g)).toHaveLength(1)
    expect(frame(markup)).toContain('title="NASDAQ:AAPL chart"')
    // The iframe fills the frame; the frame is what carries the size.
    expect(frame(markup)).toMatch(/style="[^"]*width:100%;height:100%/)
  })

  it('opens the chart with the documented defaults', () => {
    expect(settings(html(<AdvancedChart />))).toMatchObject({
      symbol: 'NASDAQ:AAPL',
      interval: 'D',
      theme: 'dark',
      width: '100%',
      height: 500,
      autosize: true,
      hide_top_toolbar: false,
      hide_side_toolbar: false,
      save_image: true,
      allow_symbol_change: true,
    })
  })

  it('writes every prop under the name TradingView reads', () => {
    const markup = html(
      <AdvancedChart
        symbol="BINANCE:BTCUSDT"
        interval="60"
        theme="light"
        width={640}
        height={600}
        autosize={false}
        hideTopToolbar
        hideSideToolbar
        saveImage={false}
      />,
    )

    expect(settings(markup)).toMatchObject({
      symbol: 'BINANCE:BTCUSDT',
      interval: '60',
      theme: 'light',
      width: 640,
      height: 600,
      autosize: false,
      hide_top_toolbar: true,
      hide_side_toolbar: true,
      save_image: false,
    })
    const chart = tag(markup, 'advanced-chart')
    expect(chart).toContain('data-symbol="BINANCE:BTCUSDT"')
    expect(chart).toContain('data-interval="60"')
    expect(chart).toContain('_width-640px')
    expect(chart).toContain('_height-600px')
    expect(frame(markup)).toContain('title="BINANCE:BTCUSDT chart"')
  })

  // `theme` is the CHART's palette. gui's stack takes a `theme` of its own, and
  // letting ours fall through would re-theme the frame — and whatever a caller
  // nests in it — to a gui theme that happens to share the name. Nor may it
  // land as `data-theme`: that attribute is what page stylesheets select a
  // theme by, and a light chart in a dark app would flip the frame's tokens.
  it('keeps the chart theme off the gui frame, and passes frame props through', () => {
    const markup = html(<AdvancedChart theme="light" rounded="$3" />)

    // Elements only: gui's injected stylesheet names every theme class.
    expect(markup.replace(/<style[\s\S]*?<\/style>/g, '')).not.toContain('t_light')
    expect(tag(markup, 'advanced-chart')).not.toContain('data-theme')
    expect(tag(markup, 'advanced-chart')).toContain('_btlr-c-radius-3')
  })

  it('mounts a new iframe when the symbol changes, and keeps it when nothing does', () => {
    const view = mount(<AdvancedChart symbol="NASDAQ:AAPL" />)
    const first = view.iframe()
    expect(first?.src).toContain(encodeURIComponent('"NASDAQ:AAPL"'))

    view.render(<AdvancedChart symbol="NASDAQ:AAPL" />)
    expect(view.iframe()).toBe(first)

    view.render(<AdvancedChart symbol="NASDAQ:GOOGL" />)
    const second = view.iframe()
    expect(second).not.toBe(first)
    expect(second?.src).toContain(encodeURIComponent('"NASDAQ:GOOGL"'))
    expect(second?.title).toBe('NASDAQ:GOOGL chart')
    expect(view.chart()?.dataset.symbol).toBe('NASDAQ:GOOGL')

    view.render(<AdvancedChart symbol="NASDAQ:GOOGL" interval="W" />)
    expect(view.iframe()).not.toBe(second)
    expect(view.chart()?.dataset.interval).toBe('W')

    view.cleanup()
  })
})
