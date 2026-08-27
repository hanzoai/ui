// @vitest-environment jsdom

/**
 * The carousel has no library behind it: the browser pages it, and what makes
 * that work is three CSS properties reaching the element. gui has no style prop
 * for any of them, and an unrecognised prop is FORWARDED rather than dropped —
 * so the failure mode is `scrollSnapType="x mandatory"` sitting in the markup as
 * an inert attribute while the carousel scrolls freely past its slides.
 *
 * That renders, measures and screenshots as a working carousel. Only reading the
 * CSS catches it, so that is what these assert.
 */
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from './carousel'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config as never} defaultTheme="dark">
      {node}
    </GuiProvider>,
  ).replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')

const three = (props: Record<string, unknown> = {}) => (
  <Carousel {...props}>
    <CarouselContent>
      <CarouselItem>one</CarouselItem>
      <CarouselItem>two</CarouselItem>
      <CarouselItem>three</CarouselItem>
    </CarouselContent>
    <CarouselPrevious />
    <CarouselNext />
  </Carousel>
)

describe('the paging is real CSS, not an attribute', () => {
  it('the scroller declares scroll-snap-type', () => {
    const m = html(three())
    expect(m).toContain('scroll-snap-type:x mandatory')
  })

  it('each slide declares scroll-snap-align', () => {
    const m = html(three())
    expect([...m.matchAll(/scroll-snap-align:\s*center/g)]).toHaveLength(3)
  })

  it('no scroll-snap property leaks to the DOM as an attribute', () => {
    // The whole point. `scrollSnapType="x mandatory"` is valid markup, invalid
    // CSS, and invisible to every assertion that is not this one.
    expect(html(three())).not.toMatch(/scrollSnap[A-Za-z]*=/)
  })

  it('the track is a grid row whose columns are one view wide', () => {
    const m = html(three())
    expect(m).toContain('_dsp-grid')
    expect(m).toContain('_gridAutoFlow-column')
    // `auto-cols-[100%]` must have been READ, not left as a class name — an
    // unread class is inert and every slide collapses to its content width.
    expect(m).toContain('_gridAutoColumns-')
    expect(m).not.toContain('auto-cols-[100%]')
  })

  it('the scroller overflows on one axis only', () => {
    // Overflowing on both puts a vertical bar on a horizontal carousel.
    const m = html(three())
    expect(m).toContain('_ox-auto')
    expect(m).toContain('_oy-hidden')
  })
})

/** Whether the button carrying `label` is unavailable, read off its own tag. */
const off = (markup: string, label: string): boolean => {
  const tag = new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`).exec(markup)?.[0]
  if (!tag) throw new Error(`no button labelled "${label}"`)
  return /aria-disabled="true"/.test(tag) || /\sdisabled[\s=>]/.test(tag)
}

const mounted = async (props: Record<string, unknown> = {}) => {
  const { render } = await import('@testing-library/react')
  return render(
    <GuiProvider config={config as never} defaultTheme="dark">
      {three(props)}
    </GuiProvider>,
  ).container.innerHTML
}

describe('the arrows', () => {
  it('have accessible names, because an icon alone has none', () => {
    const m = html(three())
    expect(m).toContain('aria-label="Previous slide"')
    expect(m).toContain('aria-label="Next slide"')
  })

  it('are both unavailable on the server, where there is nothing to measure', () => {
    const m = html(three())
    expect(off(m, 'Previous slide')).toBe(true)
    expect(off(m, 'Next slide')).toBe(true)
  })

  it('wake up once mounted — previous shut at the start, next open', () => {
    // The pair above and this one are the same carousel either side of mount,
    // and the contrast IS the assertion: `selected` starting at 0 rather than
    // `null` skips this render, and the arrows stay in their server state
    // forever. Nothing else would notice — the markup is identical, the
    // carousel scrolls by drag, and only the buttons are dead.
    return mounted().then((m) => {
      expect(off(m, 'Previous slide')).toBe(true)
      expect(off(m, 'Next slide')).toBe(false)
    })
  })

  it('a looping carousel can go back from the start', () =>
    mounted({ options: { loop: true } }).then((m) => {
      expect(off(m, 'Previous slide')).toBe(false)
      expect(off(m, 'Next slide')).toBe(false)
    }))
})

describe('the region announces itself', () => {
  it('is a carousel of slides', () => {
    const m = html(three())
    expect(m).toContain('aria-roledescription="carousel"')
    expect([...m.matchAll(/aria-roledescription="slide"/g)]).toHaveLength(3)
  })
})

describe('the api', () => {
  it('is refused outside a Carousel, rather than failing later', () => {
    // A scroller with no carousel around it has nowhere to publish its element,
    // so the api would never reach anyone. Saying so at render is the only
    // place it can be said usefully.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => html(<CarouselContent>orphan</CarouselContent>)).toThrow(/inside a <Carousel>/)
    // An ITEM is fine loose: it reads nothing from the context, and rejecting it
    // would reject markup that works.
    expect(() => html(<CarouselItem>orphan</CarouselItem>)).not.toThrow()
    spy.mockRestore()
  })

  it('exposes exactly what a caller drives it with', async () => {
    // The 5.x consumers hold the api across renders and call two things on it:
    // `scrollTo` to follow a selection made elsewhere, and `selectedScrollSnap`
    // to report one made here.
    const { render } = await import('@testing-library/react')
    let api: CarouselApi | undefined
    render(
      <GuiProvider config={config as never} defaultTheme="dark">
        {three({ setApi: (a: CarouselApi) => { api = a } })}
      </GuiProvider>,
    )
    expect(api).toBeDefined()
    expect(typeof api!.scrollTo).toBe('function')
    expect(typeof api!.selectedScrollSnap).toBe('function')
    expect(api!.slideCount()).toBe(3)
    // jsdom lays nothing out, so every slide sits at offset 0 and the nearest
    // is the first. That is the honest answer to "which slide is centred" for a
    // document with no layout — not an error, and not -1.
    expect(api!.selectedScrollSnap()).toBe(0)
  })

  it('does not announce a selection nobody made', () => {
    // A carousel that fires its select handler on mount tells the page the user
    // chose the first slide when all they did was load it — in a shop, that is
    // a selected sku and a changed price.
    const onCarouselSelect = vi.fn()
    html(three({ onCarouselSelect }))
    expect(onCarouselSelect).not.toHaveBeenCalled()
  })
})
