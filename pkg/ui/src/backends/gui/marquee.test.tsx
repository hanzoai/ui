// @vitest-environment jsdom

/**
 * Marquee's contract, asserted on the compiled markup: the loop's shape (a
 * doubled track, every copy past the first hidden from readers), where the
 * travel lives, and what each prop turns into on the element. The measured
 * duration runs on a live DOM with the layout pinned by hand, since jsdom
 * lays nothing out.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Marquee } from './marquee'

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
  return {
    track: () => host.querySelector<HTMLElement>('[data-slot="marquee-track"]')!,
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

const tags = (markup: string, slot: string) =>
  [...markup.matchAll(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`, 'g'))].map((m) => m[0])

describe('Marquee', () => {
  it('lays the items out twice, and reads only the first copy to a reader', () => {
    const markup = html(
      <Marquee repeat={3}>
        <span>one</span>
      </Marquee>,
    )
    const items = tags(markup, 'marquee-item')

    expect(tag(markup, 'marquee')).not.toBe('')
    expect(tag(markup, 'marquee-track')).not.toBe('')
    expect(tags(markup, 'marquee-group')).toHaveLength(2)
    expect(items).toHaveLength(6)
    expect(markup.match(/>one</g)).toHaveLength(6)
    expect(items[0]).not.toContain('aria-hidden')
    for (const copy of items.slice(3)) expect(copy).toContain('aria-hidden="true"')
  })

  it('runs the vertical keyframe in a column for `vertical`', () => {
    const row = tag(html(<Marquee>x</Marquee>), 'marquee-track')
    const column = tag(html(<Marquee vertical>x</Marquee>), 'marquee-track')

    expect(row).toContain('animation-name:marquee-x')
    expect(column).toContain('animation-name:marquee-y')
  })

  it('runs the track backwards for `reverse`', () => {
    const normal = tag(html(<Marquee>x</Marquee>), 'marquee-track')
    const reversed = tag(html(<Marquee reverse>x</Marquee>), 'marquee-track')

    expect(normal).toContain('animation-direction:normal')
    expect(reversed).toContain('animation-direction:reverse')
  })

  it('marks the frame for pause-on-hover only when asked, with the rule to match', () => {
    const paused = html(<Marquee pauseOnHover>x</Marquee>)
    const running = html(<Marquee>x</Marquee>)

    expect(tag(paused, 'marquee')).toContain('data-pause-hover="true"')
    expect(tag(running, 'marquee')).not.toContain('data-pause-hover')
    expect(paused).toContain('[data-pause-hover]:hover [data-slot="marquee-track"] { animation-play-state: paused }')
  })

  it('emits the keyframes once for any number of marquees, and honours reduced motion', () => {
    const markup = html(
      <>
        <Marquee>a</Marquee>
        <Marquee>b</Marquee>
      </>,
    )

    expect(markup.match(/@keyframes marquee-x/g)).toHaveLength(1)
    expect(markup).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('carries a className through onto the frame', () => {
    const markup = html(<Marquee className="my-marquee">x</Marquee>)

    expect(tag(markup, 'marquee')).toContain('my-marquee')
  })
})

describe('Marquee measures', () => {
  const layout = { stage: 600, track: 240 }
  const real = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')!
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get(this: HTMLElement) {
        const s = this.getAttribute('data-slot')
        if (s === 'marquee-stage') return layout.stage
        if (s === 'marquee-track') return layout.track
        return 0
      },
    })
  })
  afterEach(() => Object.defineProperty(HTMLElement.prototype, 'offsetWidth', real))

  it('takes the duration from half the rendered track over `speed`', () => {
    const view = mount(
      <Marquee speed={60}>x</Marquee>,
    )

    // 240px track / 2 / 60px/s = 2s.
    expect(view.track().style.animationDuration).toBe('2s')
    view.cleanup()
  })
})
