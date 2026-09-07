// @vitest-environment jsdom

/**
 * The stacked carousel's contract: one card in front, a swipe, the arrows, the
 * dots, the keys and auto-play all move it, and the far cards are not drawn.
 * Asserted on compiled markup and a live DOM, never on text alone — gui drops
 * an unrecognised prop silently, so "the title rendered" proves only that a
 * string reached a Text host.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { AppleCardsCarousel, gradientPresets, type CarouselCard } from './apple-cards-carousel'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

const tags = (markup: string, slot: string) =>
  [...markup.matchAll(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`, 'g'))].map((m) => m[0])

const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  const region = () => host.querySelector<HTMLElement>('[data-slot="apple-carousel"]')!
  const cards = () => [...host.querySelectorAll<HTMLElement>('[data-slot="apple-carousel-card"]')]
  /** One pointer event, bubbling from `el`. */
  const pointer = (el: Element, type: string, clientX: number) =>
    act(() => {
      el.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX, pointerId: 1 }))
    })
  return {
    host,
    region,
    cards,
    pointer,
    active: () => cards().findIndex((c) => c.dataset.active === 'true'),
    dots: () => [...host.querySelectorAll<HTMLElement>('[data-slot="apple-carousel-dot"]')],
    previous: () => host.querySelector<HTMLButtonElement>('[data-slot="apple-carousel-previous"]'),
    next: () => host.querySelector<HTMLButtonElement>('[data-slot="apple-carousel-next"]'),
    key: (key: string) =>
      act(() => {
        region().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
      }),
    hover: (over: boolean) =>
      act(() => {
        // React derives mouseenter/leave from mouseover/out with a relatedTarget outside the node.
        region().dispatchEvent(
          new MouseEvent(over ? 'mouseover' : 'mouseout', { bubbles: true, relatedTarget: document.body }),
        )
      }),
    /** A pointer drag on the front card: down at `from`, then one move per `path` point 100ms apart, then up. Fake timers own the clock. */
    swipe: (from: number, ...path: number[]) => {
      const card = cards().find((c) => c.dataset.active === 'true')!
      pointer(card, 'pointerdown', from)
      for (const x of path) {
        vi.advanceTimersByTime(100)
        pointer(card, 'pointermove', x)
      }
      pointer(card, 'pointerup', path[path.length - 1] ?? from)
    },
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const three: CarouselCard[] = [
  { id: 'a', title: 'First', subtitle: 'One', description: 'Card one' },
  { id: 'b', title: 'Second', gradient: gradientPresets.ocean },
  { id: 'c', title: 'Third' },
]

const five: CarouselCard[] = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, title: id }))

afterEach(() => {
  vi.useRealTimers()
})

describe('AppleCardsCarousel', () => {
  it('is a labelled carousel region of slides with exactly one in front', () => {
    const markup = html(<AppleCardsCarousel cards={three} />)
    const region = tags(markup, 'apple-carousel')[0]
    expect(region).toContain('role="region"')
    expect(region).toContain('aria-roledescription="carousel"')
    expect(region).toContain('tabindex="0"')
    // Focusable, so it has to say what it is.
    expect(region).toMatch(/aria-label="[^"]+"/)

    const cards = tags(markup, 'apple-carousel-card')
    expect(cards).toHaveLength(3)
    expect(cards.filter((t) => t.includes('data-active="true"'))).toHaveLength(1)
    expect(cards[1]).toContain('aria-roledescription="slide"')
    expect(cards[1]).toContain('aria-label="2 of 3"')
    // Only the front card is in the accessibility tree; the peeking ones are decoration.
    expect(cards[0]).not.toContain('aria-hidden')
    expect(cards[1]).toContain('aria-hidden="true"')
  })

  it('draws the front card and the two behind it, and nothing further back', () => {
    const cards = tags(html(<AppleCardsCarousel cards={five} />), 'apple-carousel-card')
    const hidden = cards.map((t) => /class="[^"]*_dsp-none/.test(t))
    expect(hidden).toEqual([false, false, false, true, true])
  })

  it('shows arrows and dots by default, and can hide either', () => {
    const shown = html(<AppleCardsCarousel cards={three} />)
    const arrows = [...tags(shown, 'apple-carousel-previous'), ...tags(shown, 'apple-carousel-next')]
    expect(arrows).toHaveLength(2)
    // Arrows are a desktop control: hidden until the `$md` rung, where there
    // is room beside the card for a pointer to reach them.
    for (const arrow of arrows) {
      expect(arrow).toMatch(/_dsp-none/)
      expect(arrow).toMatch(/_dsp-_md_flex/)
    }
    expect(tags(shown, 'apple-carousel-dot')).toHaveLength(3)

    const bare = html(<AppleCardsCarousel cards={three} showArrows={false} showDots={false} />)
    expect(bare).not.toContain('apple-carousel-previous')
    expect(bare).not.toContain('apple-carousel-dot')
  })

  it('the arrows and dots are real buttons that name what they do and submit nothing', () => {
    const markup = html(<AppleCardsCarousel cards={three} />)
    const controls = [
      ...tags(markup, 'apple-carousel-previous'),
      ...tags(markup, 'apple-carousel-next'),
      ...tags(markup, 'apple-carousel-dot'),
    ]
    expect(controls).toHaveLength(5)
    for (const tag of controls) {
      expect(tag.startsWith('<button')).toBe(true)
      expect(tag).toContain('type="button"')
      expect(tag).toMatch(/aria-label="[^"]+"/)
    }
    expect(markup).toContain('aria-label="Previous card"')
    expect(markup).toContain('aria-label="Next card"')
    expect(tags(markup, 'apple-carousel-dot')[0]).toContain('aria-current="true"')
  })

  it('advances to the next card when Next is clicked', () => {
    const view = mount(<AppleCardsCarousel cards={three} />)
    expect(view.active()).toBe(0)

    act(() => view.next()?.click())

    expect(view.active()).toBe(1)
    view.cleanup()
  })

  it('wraps from the last card back to the first', () => {
    const view = mount(<AppleCardsCarousel cards={three} />)

    act(() => view.previous()?.click())
    expect(view.active()).toBe(2)

    act(() => view.next()?.click())
    expect(view.active()).toBe(0)
    view.cleanup()
  })

  it('a dot click jumps straight to that card', () => {
    const view = mount(<AppleCardsCarousel cards={three} />)

    act(() => view.dots()[2].click())

    expect(view.active()).toBe(2)
    expect(view.dots()[2].dataset.active).toBe('true')
    expect(view.dots()[0].dataset.active).toBeUndefined()
    view.cleanup()
  })

  it('the arrow keys move the front card while the region has focus', () => {
    const view = mount(<AppleCardsCarousel cards={three} />)

    view.key('ArrowRight')
    expect(view.active()).toBe(1)

    view.key('ArrowLeft')
    expect(view.active()).toBe(0)
    view.cleanup()
  })

  it('a drag past the threshold commits to the neighbour in the direction of travel', () => {
    vi.useFakeTimers()
    const view = mount(<AppleCardsCarousel cards={three} swipeThreshold={50} />)

    view.swipe(300, 260, 200)
    expect(view.active()).toBe(1)

    view.swipe(200, 240, 300)
    expect(view.active()).toBe(0)
    view.cleanup()
  })

  it('a drag short of the threshold springs back and stays put', () => {
    vi.useFakeTimers()
    const view = mount(<AppleCardsCarousel cards={three} swipeThreshold={50} />)

    view.swipe(300, 290, 280)

    expect(view.active()).toBe(0)
    // The front card is back where it started, with no drag offset in its transform.
    expect(view.cards()[0].style.transform).toBe('translateX(0px) scale(1)')
    view.cleanup()
  })

  it('the front card follows the pointer while it is held, with no transition', () => {
    const view = mount(<AppleCardsCarousel cards={three} />)
    const card = view.cards()[0]

    view.pointer(card, 'pointerdown', 300)
    view.pointer(card, 'pointermove', 270)

    expect(card.style.transform).toBe('translateX(-30px) scale(1)')
    expect(card.style.transition).toBe('none')
    // The swipe is the card's on a touch screen, and it drags no text selection with it.
    expect(card.style.touchAction).toBe('pan-y')
    expect(card.style.userSelect).toBe('none')
    view.cleanup()
  })

  it('a pointer passing over the front card without a press moves nothing', () => {
    const view = mount(<AppleCardsCarousel cards={three} />)
    const card = view.cards()[0]

    // `pointermove` fires for a hover too; only a press starts a drag.
    view.pointer(card, 'pointermove', 500)
    expect(card.style.transform).toBe('translateX(0px) scale(1)')
    // At rest the card springs, and it is a real transition rather than the drag's 'none'.
    expect(card.style.transition).toContain('transform')

    view.pointer(card, 'pointerup', 500)
    expect(view.active()).toBe(0)
    view.cleanup()
  })

  it('a press that begins on a control inside the card is a click, not a drag', () => {
    vi.useFakeTimers()
    const onCta = vi.fn()
    const view = mount(
      <AppleCardsCarousel
        swipeThreshold={50}
        cards={[
          {
            id: 'x',
            title: 'x',
            content: (
              <button type="button" data-testid="cta" onClick={onCta}>
                Learn more
              </button>
            ),
          },
          { id: 'y', title: 'y' },
        ]}
      />,
    )
    const cta = view.host.querySelector<HTMLButtonElement>('[data-testid="cta"]')!

    view.pointer(cta, 'pointerdown', 300)
    vi.advanceTimersByTime(100)
    view.pointer(cta, 'pointermove', 100)
    expect(view.cards()[0].style.transform).toBe('translateX(0px) scale(1)')
    view.pointer(cta, 'pointerup', 100)
    act(() => cta.click())

    expect(view.active()).toBe(0)
    expect(onCta).toHaveBeenCalledTimes(1)
    view.cleanup()
  })

  it('a quick flick commits even when it is shorter than the threshold', () => {
    vi.useFakeTimers()
    const view = mount(<AppleCardsCarousel cards={three} swipeThreshold={500} />)
    const card = view.cards()[0]

    // 40px in 10ms is 4px/ms — far over the flick speed, far under the distance.
    view.pointer(card, 'pointerdown', 300)
    vi.advanceTimersByTime(10)
    view.pointer(card, 'pointermove', 260)
    view.pointer(card, 'pointerup', 260)

    expect(view.active()).toBe(1)
    view.cleanup()
  })

  it('a flick that then rests before release is judged on distance alone', () => {
    vi.useFakeTimers()
    const view = mount(<AppleCardsCarousel cards={three} swipeThreshold={500} />)
    const card = view.cards()[0]

    view.pointer(card, 'pointerdown', 300)
    vi.advanceTimersByTime(10)
    view.pointer(card, 'pointermove', 260)
    vi.advanceTimersByTime(500)
    view.pointer(card, 'pointerup', 260)

    expect(view.active()).toBe(0)
    view.cleanup()
  })

  it('auto-plays on its interval, holds while hovered, and does nothing when off', () => {
    vi.useFakeTimers()
    const on = mount(<AppleCardsCarousel cards={three} autoPlay autoPlayInterval={1000} />)
    expect(on.active()).toBe(0)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(on.active()).toBe(1)

    on.hover(true)
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(on.active()).toBe(1)

    on.hover(false)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(on.active()).toBe(2)
    on.cleanup()

    const off = mount(<AppleCardsCarousel cards={three} autoPlayInterval={1000} />)
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(off.active()).toBe(0)
    off.cleanup()
  })

  it('never starts auto-play under a reduced-motion preference, and cuts every card straight to place', () => {
    vi.useFakeTimers()
    const matchMedia = window.matchMedia
    window.matchMedia = ((query: string) =>
      ({ matches: query.includes('prefers-reduced-motion'), media: query }) as MediaQueryList) as typeof window.matchMedia

    const view = mount(<AppleCardsCarousel cards={three} autoPlay autoPlayInterval={1000} />)
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(view.active()).toBe(0)

    act(() => view.next()?.click())
    expect(view.active()).toBe(1)
    for (const card of view.cards()) expect(card.style.transition).toBe('none')

    view.cleanup()
    window.matchMedia = matchMedia
  })

  it('renders custom content in place of title/subtitle/description', () => {
    const markup = html(
      <AppleCardsCarousel
        cards={[{ id: 'x', title: 'unused', content: <span data-testid="custom">Hello</span> }]}
      />,
    )
    expect(markup).toContain('data-testid="custom"')
    expect(markup).not.toContain('>unused<')
  })

  it('paints a card from its gradient, or from its image behind a legibility wash', () => {
    expect(html(<AppleCardsCarousel cards={three} />)).toContain(gradientPresets.ocean)

    const markup = html(<AppleCardsCarousel cards={[{ id: 'p', title: 'Peak', image: '/peak.jpg' }]} />)
    const img = markup.match(/<img [^>]*>/)?.[0] ?? ''
    expect(img).toContain('src="/peak.jpg"')
    expect(img).toContain('alt="Peak"')
    expect(markup).toContain('linear-gradient(to top')
  })

  it('gradient presets are real CSS gradients, one per documented name', () => {
    const names: (keyof typeof gradientPresets)[] = [
      'sunset',
      'ocean',
      'fire',
      'forest',
      'galaxy',
      'aurora',
      'peach',
      'lavender',
    ]
    expect(Object.keys(gradientPresets).sort()).toEqual([...names].sort())
    for (const name of names) expect(gradientPresets[name]).toMatch(/^linear-gradient\(/)
  })
})
