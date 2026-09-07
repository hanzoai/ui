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
import { Financials } from './financials'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

const frame = (markup: string) => markup.match(/<iframe [^>]*>/)?.[0] ?? ''

const EMBED = 'https://www.tradingview-widget.com/embed-widget/financials/?locale='

/** The settings TradingView will read, decoded from the iframe's address. */
const settings = (markup: string): Record<string, unknown> => {
  const src = frame(markup).match(/src="([^"]+)"/)?.[1] ?? ''
  expect(src.startsWith(EMBED)).toBe(true)
  const [, encoded] = src.slice(EMBED.length).split('#')
  return JSON.parse(decodeURIComponent(encoded))
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
    widget: () => host.querySelector<HTMLElement>('[data-slot="financials"]'),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('Financials', () => {
  it('is a sized frame holding one TradingView iframe', () => {
    const markup = html(<Financials />)
    const widget = tag(markup, 'financials')

    expect(widget.startsWith('<div')).toBe(true)
    expect(widget).toContain('_height-800px')
    expect(markup.match(/<iframe /g)).toHaveLength(1)
    expect(frame(markup)).toContain('title="NASDAQ:AAPL financials"')
    // The iframe fills the frame; the frame is what carries the size.
    expect(frame(markup)).toMatch(/style="[^"]*width:100%;height:100%/)
  })

  it('opens the widget with the documented defaults', () => {
    expect(settings(html(<Financials />))).toMatchObject({
      symbol: 'NASDAQ:AAPL',
      width: '100%',
      height: 800,
      colorTheme: 'dark',
      isTransparent: false,
      displayMode: 'adaptive',
      largeChartUrl: '',
    })
  })

  it('writes every prop under the name TradingView reads', () => {
    const markup = html(
      <Financials
        symbol="BINANCE:BTCUSDT"
        width={640}
        height={600}
        locale="fr"
        colorTheme="light"
        isTransparent
        displayMode="compact"
        largeChartUrl="https://example.com/chart"
      />,
    )

    expect(settings(markup)).toMatchObject({
      symbol: 'BINANCE:BTCUSDT',
      width: 640,
      height: 600,
      colorTheme: 'light',
      isTransparent: true,
      displayMode: 'compact',
      largeChartUrl: 'https://example.com/chart',
    })
    const src = frame(markup).match(/src="([^"]+)"/)?.[1] ?? ''
    expect(decodeURIComponent(src.slice(EMBED.length).split('#')[0])).toBe('fr')
    const widget = tag(markup, 'financials')
    expect(widget).toContain('data-symbol="BINANCE:BTCUSDT"')
    expect(widget).toContain('data-display-mode="compact"')
    expect(widget).toContain('_width-640px')
    expect(widget).toContain('_height-600px')
    expect(frame(markup)).toContain('title="BINANCE:BTCUSDT financials"')
  })

  // `colorTheme` is the WIDGET's palette. gui's stack takes a `theme` of its
  // own, and letting ours fall through would re-theme the frame — and
  // whatever a caller nests in it — to a gui theme that happens to share the
  // name. Nor may it land as `data-theme`: that attribute is what page
  // stylesheets select a theme by, and a light widget in a dark app would
  // flip the frame's tokens.
  it('keeps the widget theme off the gui frame, and passes frame props through', () => {
    const markup = html(<Financials colorTheme="light" rounded="$3" />)

    // Elements only: gui's injected stylesheet names every theme class.
    expect(markup.replace(/<style[\s\S]*?<\/style>/g, '')).not.toContain('t_light')
    expect(tag(markup, 'financials')).not.toContain('data-theme')
    expect(tag(markup, 'financials')).toContain('_btlr-c-radius-3')
  })

  it('mounts a new iframe when the symbol changes, and keeps it when nothing does', () => {
    const view = mount(<Financials symbol="NASDAQ:AAPL" />)
    const first = view.iframe()
    expect(first?.src).toContain(encodeURIComponent('"NASDAQ:AAPL"'))

    view.render(<Financials symbol="NASDAQ:AAPL" />)
    expect(view.iframe()).toBe(first)

    view.render(<Financials symbol="NASDAQ:GOOGL" />)
    const second = view.iframe()
    expect(second).not.toBe(first)
    expect(second?.src).toContain(encodeURIComponent('"NASDAQ:GOOGL"'))
    expect(second?.title).toBe('NASDAQ:GOOGL financials')
    expect(view.widget()?.dataset.symbol).toBe('NASDAQ:GOOGL')

    view.render(<Financials symbol="NASDAQ:GOOGL" displayMode="compact" />)
    expect(view.iframe()).not.toBe(second)
    expect(view.widget()?.dataset.displayMode).toBe('compact')

    view.cleanup()
  })
})
