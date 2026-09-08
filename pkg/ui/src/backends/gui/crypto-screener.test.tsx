// @vitest-environment jsdom

/**
 * The screener is TradingView's document, so the whole contract is the
 * address it is opened at: every documented prop has to arrive in the
 * iframe's `src` under the name TradingView reads, and a changed prop has to
 * reach a NEW iframe — a fragment-only change to `src` is a same-document
 * navigation the widget never sees. Asserted on the server markup for the
 * address and on a live tree for the remount.
 */
import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { CryptoScreener } from './crypto-screener'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

const frame = (markup: string) => markup.match(/<iframe [^>]*>/)?.[0] ?? ''

const EMBED = 'https://www.tradingview-widget.com/embed-widget/screener/?locale=en#'

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
    screener: () => host.querySelector<HTMLElement>('[data-slot="crypto-screener"]'),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('CryptoScreener', () => {
  it('is a sized frame holding one TradingView iframe', () => {
    const markup = html(<CryptoScreener />)
    const screener = tag(markup, 'crypto-screener')

    expect(screener.startsWith('<div')).toBe(true)
    expect(screener).toContain('_height-550px')
    expect(markup.match(/<iframe /g)).toHaveLength(1)
    expect(frame(markup)).toContain('title="Crypto screener"')
    // The iframe fills the frame; the frame is what carries the size.
    expect(frame(markup)).toMatch(/style="[^"]*width:100%;height:100%/)
  })

  it('opens the screener with the documented defaults', () => {
    expect(settings(html(<CryptoScreener />))).toMatchObject({
      defaultColumn: 'overview',
      screener_type: 'crypto_mkt',
      displayCurrency: 'USD',
      colorTheme: 'dark',
      isTransparent: false,
      locale: 'en',
      width: '100%',
      height: 550,
    })
  })

  it('writes every prop under the name TradingView reads', () => {
    const markup = html(
      <CryptoScreener
        market="crypto"
        defaultColumn="performance"
        displayCurrency="EUR"
        colorTheme="light"
        isTransparent
        locale="ja"
        width={640}
        height={400}
      />,
    )

    expect(settings(markup)).toMatchObject({
      defaultColumn: 'performance',
      screener_type: 'crypto_mkt',
      displayCurrency: 'EUR',
      colorTheme: 'light',
      isTransparent: true,
      locale: 'ja',
      width: 640,
      height: 400,
    })
    const screener = tag(markup, 'crypto-screener')
    expect(screener).toContain('data-column="performance"')
    expect(screener).toContain('data-color-theme="light"')
    expect(screener).toContain('_width-640px')
    expect(screener).toContain('_height-400px')
  })

  // `colorTheme` is the SCREENER's palette. gui's stack takes a `theme` of its
  // own, and letting ours fall through would re-theme the frame — and
  // whatever a caller nests in it — to a gui theme that happens to share the
  // name. Nor may it land as `data-theme`: that attribute is what page
  // stylesheets select a theme by, and a light screener in a dark app would
  // flip the frame's tokens.
  it('keeps the screener theme off the gui frame, and passes frame props through', () => {
    const markup = html(<CryptoScreener colorTheme="light" rounded="$3" />)

    // Elements only: gui's injected stylesheet names every theme class.
    expect(markup.replace(/<style[\s\S]*?<\/style>/g, '')).not.toContain('t_light')
    expect(tag(markup, 'crypto-screener')).not.toContain('data-theme=')
    expect(tag(markup, 'crypto-screener')).toContain('_btlr-c-radius-3')
  })

  it('mounts a new iframe when the column changes, and keeps it when nothing does', () => {
    const view = mount(<CryptoScreener defaultColumn="overview" />)
    const first = view.iframe()
    expect(first?.src).toContain(encodeURIComponent('"overview"'))

    view.render(<CryptoScreener defaultColumn="overview" />)
    expect(view.iframe()).toBe(first)

    view.render(<CryptoScreener defaultColumn="performance" />)
    const second = view.iframe()
    expect(second).not.toBe(first)
    expect(second?.src).toContain(encodeURIComponent('"performance"'))
    expect(view.screener()?.dataset.column).toBe('performance')

    view.render(<CryptoScreener defaultColumn="performance" colorTheme="light" />)
    expect(view.iframe()).not.toBe(second)
    expect(view.screener()?.dataset.colorTheme).toBe('light')

    view.cleanup()
  })
})
