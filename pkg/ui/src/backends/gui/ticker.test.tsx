// @vitest-environment jsdom

/**
 * Ticker's contract, asserted on the compiled markup: the doubled track with
 * the repeat hidden from readers, which way the keyframe runs, and the
 * pause-on-hover rule.
 *
 * Imports `./ticker` directly rather than the backend barrel: the barrel pulls
 * the whole surface in, and a test for one component should not fail because a
 * different one's dependency moved.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Ticker } from './ticker'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

const tags = (markup: string, slot: string) =>
  [...markup.matchAll(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`, 'g'))].map((m) => m[0])

describe('Ticker', () => {
  it('lays the content out twice, and hides the second copy from a reader', () => {
    const markup = html(
      <Ticker>
        <span>breaking news</span>
      </Ticker>,
    )
    const groups = tags(markup, 'ticker-group')

    expect(tag(markup, 'ticker')).not.toBe('')
    expect(tag(markup, 'ticker-track')).not.toBe('')
    expect(groups).toHaveLength(2)
    expect(markup.match(/>breaking news</g)).toHaveLength(2)
    expect(groups[0]).not.toContain('aria-hidden')
    expect(groups[1]).toContain('aria-hidden="true"')
  })

  it('runs the keyframe forward for the default direction, and reverses it for "right"', () => {
    const left = tag(html(<Ticker>x</Ticker>), 'ticker-track')
    const right = tag(html(<Ticker direction="right">x</Ticker>), 'ticker-track')

    expect(left).toContain('animation-direction:normal')
    expect(right).toContain('animation-direction:reverse')
  })

  it('sets the loop duration from `speed` seconds', () => {
    const track = tag(html(<Ticker speed={12}>x</Ticker>), 'ticker-track')

    expect(track).toContain('animation-duration:12s')
  })

  it('pauses on hover by default, and can be turned off', () => {
    const paused = html(<Ticker>x</Ticker>)
    const running = html(<Ticker pauseOnHover={false}>x</Ticker>)

    expect(tag(paused, 'ticker')).toContain('data-pause-hover="true"')
    expect(tag(running, 'ticker')).not.toContain('data-pause-hover')
    expect(paused).toContain(
      '[data-pause-hover]:hover [data-slot="ticker-track"] { animation-play-state: paused }',
    )
  })

  it('emits the keyframes once for any number of tickers, and honours reduced motion', () => {
    const markup = html(
      <>
        <Ticker>a</Ticker>
        <Ticker>b</Ticker>
      </>,
    )

    expect(markup.match(/@keyframes ticker-scroll/g)).toHaveLength(1)
    expect(markup).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('carries a className through onto the frame', () => {
    const markup = html(<Ticker className="my-ticker">x</Ticker>)

    expect(tag(markup, 'ticker')).toContain('my-ticker')
  })
})
