// @vitest-environment jsdom

/**
 * The widget is TradingView's document, so the whole contract is the address
 * it is opened at: every documented prop has to arrive in the iframe's `src`
 * under the name TradingView reads, and a changed prop has to reach a NEW
 * iframe — a fragment-only change to `src` is a same-document navigation the
 * widget never sees. Asserted on the server markup for the address and on a
 * live tree for the remount.
 */
import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { TechnicalAnalysis } from './technical-analysis'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

const frame = (markup: string) => markup.match(/<iframe [^>]*>/)?.[0] ?? ''

const EMBED = 'https://www.tradingview-widget.com/embed-widget/technical-analysis/?locale=en#'

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
    widget: () => host.querySelector<HTMLElement>('[data-slot="technical-analysis"]'),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('TechnicalAnalysis', () => {
  it('is a sized frame holding one TradingView iframe', () => {
    const markup = html(<TechnicalAnalysis />)
    const widget = tag(markup, 'technical-analysis')

    expect(widget.startsWith('<div')).toBe(true)
    expect(widget).toContain('_height-450px')
    expect(markup.match(/<iframe /g)).toHaveLength(1)
    expect(frame(markup)).toContain('title="NASDAQ:AAPL technical analysis"')
    // The iframe fills the frame; the frame is what carries the size.
    expect(frame(markup)).toMatch(/style="[^"]*width:100%;height:100%/)
  })

  it('opens the widget with the documented defaults', () => {
    expect(settings(html(<TechnicalAnalysis />))).toMatchObject({
      symbol: 'NASDAQ:AAPL',
      interval: '1D',
      width: '100%',
      height: 450,
      locale: 'en',
      colorTheme: 'dark',
      isTransparent: false,
      showIntervalTabs: true,
      displayMode: 'single',
    })
  })

  it('writes every prop under the name TradingView reads', () => {
    const markup = html(
      <TechnicalAnalysis
        symbol="BINANCE:BTCUSDT"
        interval="1h"
        width={640}
        height={600}
        locale="ja"
        colorTheme="light"
        isTransparent
        showIntervalTabs={false}
        displayMode="multiple"
      />,
    )

    expect(settings(markup)).toMatchObject({
      symbol: 'BINANCE:BTCUSDT',
      interval: '1h',
      width: 640,
      height: 600,
      locale: 'ja',
      colorTheme: 'light',
      isTransparent: true,
      showIntervalTabs: false,
      displayMode: 'multiple',
    })
    const widget = tag(markup, 'technical-analysis')
    expect(widget).toContain('data-symbol="BINANCE:BTCUSDT"')
    expect(widget).toContain('data-interval="1h"')
    expect(widget).toContain('_width-640px')
    expect(widget).toContain('_height-600px')
    expect(frame(markup)).toContain('title="BINANCE:BTCUSDT technical analysis"')
  })

  // `colorTheme` is the WIDGET's palette. gui's stack takes a `theme` of its
  // own, and letting ours fall through would re-theme the frame — and
  // whatever a caller nests in it — to a gui theme that happens to share the
  // name. Nor may it land as `data-theme`: that attribute is what page
  // stylesheets select a theme by, and a light widget in a dark app would
  // flip the frame's tokens.
  it('keeps the widget theme off the gui frame, and passes frame props through', () => {
    const markup = html(<TechnicalAnalysis colorTheme="light" rounded="$3" />)

    // Elements only: gui's injected stylesheet names every theme class.
    expect(markup.replace(/<style[\s\S]*?<\/style>/g, '')).not.toContain('t_light')
    expect(tag(markup, 'technical-analysis')).not.toContain('data-theme')
    expect(tag(markup, 'technical-analysis')).toContain('_btlr-c-radius-3')
  })

  it('mounts a new iframe when the symbol changes, and keeps it when nothing does', () => {
    const view = mount(<TechnicalAnalysis symbol="NASDAQ:AAPL" />)
    const first = view.iframe()
    expect(first?.src).toContain(encodeURIComponent('"NASDAQ:AAPL"'))

    view.render(<TechnicalAnalysis symbol="NASDAQ:AAPL" />)
    expect(view.iframe()).toBe(first)

    view.render(<TechnicalAnalysis symbol="NASDAQ:GOOGL" />)
    const second = view.iframe()
    expect(second).not.toBe(first)
    expect(second?.src).toContain(encodeURIComponent('"NASDAQ:GOOGL"'))
    expect(second?.title).toBe('NASDAQ:GOOGL technical analysis')
    expect(view.widget()?.dataset.symbol).toBe('NASDAQ:GOOGL')

    view.render(<TechnicalAnalysis symbol="NASDAQ:GOOGL" interval="1W" />)
    expect(view.iframe()).not.toBe(second)
    expect(view.widget()?.dataset.interval).toBe('1W')

    view.cleanup()
  })
})
