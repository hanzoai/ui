// @vitest-environment jsdom

/**
 * The feed is TradingView's document, so the whole contract is the address it
 * is opened at: every documented prop has to arrive in the iframe's `src`
 * under the name TradingView reads, `feedMode` gates whether `market` or
 * `symbol` is written at all, and a changed prop has to reach a NEW iframe —
 * a fragment-only change to `src` is a same-document navigation the widget
 * never sees. Asserted on the server markup for the address and on a live
 * tree for the remount.
 */
import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { NewsTimeline } from './news-timeline'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

const frame = (markup: string) => markup.match(/<iframe [^>]*>/)?.[0] ?? ''

const EMBED = 'https://www.tradingview-widget.com/embed-widget/timeline/?locale='

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
    timeline: () => host.querySelector<HTMLElement>('[data-slot="news-timeline"]'),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('NewsTimeline', () => {
  it('is a sized frame holding one TradingView iframe', () => {
    const markup = html(<NewsTimeline />)
    const timeline = tag(markup, 'news-timeline')

    expect(timeline.startsWith('<div')).toBe(true)
    expect(timeline).toContain('_height-400px')
    expect(markup.match(/<iframe /g)).toHaveLength(1)
    expect(frame(markup)).toContain('title="News timeline"')
    // The iframe fills the frame; the frame is what carries the size.
    expect(frame(markup)).toMatch(/style="[^"]*width:100%;height:100%/)
  })

  it('defaults to the all_symbols feed', () => {
    const result = settings(html(<NewsTimeline />))
    expect(result).toMatchObject({
      displayMode: 'regular',
      feedMode: 'all_symbols',
      colorTheme: 'dark',
      isTransparent: false,
      width: '100%',
      height: 400,
    })
    expect(result).not.toHaveProperty('market')
    expect(result).not.toHaveProperty('symbol')
  })

  it('writes market only when feedMode is market', () => {
    const result = settings(html(<NewsTimeline feedMode="market" market="stock" />))
    expect(result).toMatchObject({ feedMode: 'market', market: 'stock' })
    expect(result).not.toHaveProperty('symbol')
  })

  it('writes symbol only when feedMode is symbol', () => {
    const result = settings(html(<NewsTimeline feedMode="symbol" symbol="NASDAQ:AAPL" />))
    expect(result).toMatchObject({ feedMode: 'symbol', symbol: 'NASDAQ:AAPL' })
    expect(result).not.toHaveProperty('market')
  })

  it('writes every prop under the name TradingView reads', () => {
    const markup = html(
      <NewsTimeline
        feedMode="market"
        market="crypto"
        colorTheme="light"
        locale="ja"
        isTransparent
        width={640}
        height={300}
      />,
    )
    const src = frame(markup).match(/src="([^"]+)"/)?.[1] ?? ''
    expect(src.startsWith(`${EMBED}ja`)).toBe(true)

    expect(settings(markup)).toMatchObject({
      feedMode: 'market',
      market: 'crypto',
      colorTheme: 'light',
      isTransparent: true,
      width: 640,
      height: 300,
    })
    const timeline = tag(markup, 'news-timeline')
    expect(timeline).toContain('data-feed-mode="market"')
    expect(timeline).toContain('data-color-theme="light"')
    expect(timeline).toContain('_width-640px')
    expect(timeline).toContain('_height-300px')
  })

  // `colorTheme` is the FEED's palette. gui's stack takes a `theme` of its
  // own, and letting ours fall through would re-theme the frame — and
  // whatever a caller nests in it — to a gui theme that happens to share the
  // name. Nor may it land as `data-theme`: that attribute is what page
  // stylesheets select a theme by, and a light feed in a dark app would flip
  // the frame's tokens.
  it('keeps the feed theme off the gui frame, and passes frame props through', () => {
    const markup = html(<NewsTimeline colorTheme="light" rounded="$3" />)

    expect(markup.replace(/<style[\s\S]*?<\/style>/g, '')).not.toContain('t_light')
    expect(tag(markup, 'news-timeline')).not.toContain('data-theme')
    expect(tag(markup, 'news-timeline')).toContain('_btlr-c-radius-3')
  })

  it('mounts a new iframe when feedMode changes, and keeps it when nothing does', () => {
    const view = mount(<NewsTimeline feedMode="all_symbols" />)
    const first = view.iframe()
    expect(first?.src).toContain(encodeURIComponent('"all_symbols"'))

    view.render(<NewsTimeline feedMode="all_symbols" />)
    expect(view.iframe()).toBe(first)

    view.render(<NewsTimeline feedMode="symbol" symbol="NASDAQ:AAPL" />)
    const second = view.iframe()
    expect(second).not.toBe(first)
    expect(second?.src).toContain(encodeURIComponent('NASDAQ:AAPL'))
    expect(view.timeline()?.dataset.feedMode).toBe('symbol')

    view.cleanup()
  })
})
