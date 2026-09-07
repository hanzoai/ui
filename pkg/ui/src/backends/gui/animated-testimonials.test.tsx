// @vitest-environment jsdom

/**
 * AnimatedTestimonials: the active slide's content renders as a quotation, the
 * dots are real buttons and mark the active one, a click moves to the clicked
 * slide and remounts the card so its entrance plays, and autoplay advances on
 * a timer and wraps while `autoPlay={false}` holds still.
 *
 * Imports `./animated-testimonials` directly rather than the backend barrel:
 * the barrel pulls the whole surface in, and a test for one component should
 * not fail because a different one's dependency moved.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { AnimatedTestimonials, type Testimonial } from './animated-testimonials'

const testimonials: Testimonial[] = [
  { id: 'a', content: 'First quote', author: 'Ada Lovelace', role: 'Engineer', company: 'Acme' },
  { id: 'b', content: 'Second quote', author: 'Grace Hopper' },
  { id: 'c', content: 'Third quote', author: 'Katherine Johnson', role: 'Scientist' },
]

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
    host,
    dots: () => [...host.querySelectorAll<HTMLElement>('[data-slot="animated-testimonials-dot"]')],
    card: () => host.querySelector('[data-slot="card"]'),
    quote: () => host.querySelector('[data-slot="animated-testimonials-quote"]')?.textContent ?? '',
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

const dotTags = (markup: string) =>
  [...markup.matchAll(/<[a-z0-9]+[^>]*data-slot="animated-testimonials-dot"[^>]*>/g)].map((m) => m[0])

describe('AnimatedTestimonials', () => {
  it('renders the first testimonial and one dot per entry', () => {
    const markup = html(<AnimatedTestimonials testimonials={testimonials} autoPlay={false} />)

    expect(markup).toContain('data-slot="animated-testimonials"')
    expect(markup).toContain('Ada Lovelace')
    expect(markup).toContain('Engineer, Acme')
    expect(dotTags(markup)).toHaveLength(3)
    // Author without a role renders no meta line, so it is checked separately.
    expect(html(<AnimatedTestimonials testimonials={[testimonials[1]]} autoPlay={false} />)).not.toContain(
      'animated-testimonials-meta',
    )
  })

  // A reader announces a quotation only from the elements: the quote is a <p>
  // in a <blockquote>, the author a <cite>. Styled-to-classes, never spans.
  it('renders the slide as a blockquote with a cited author', () => {
    const markup = html(<AnimatedTestimonials testimonials={testimonials} autoPlay={false} />)

    expect(markup).toMatch(/<blockquote[^>]*>[\s\S]*<p[^>]*data-slot="animated-testimonials-quote"/)
    expect(tag(markup, 'animated-testimonials-author').startsWith('<cite')).toBe(true)
    expect(tag(markup, 'animated-testimonials-meta').startsWith('<p')).toBe(true)
    expect(markup).toMatch(/<footer[^>]*>[\s\S]*<cite/)
    for (const leak of ['fontstyle=', 'fontweight=', 'font-style='])
      expect(markup, leak).not.toContain(leak)
  })

  // A dot is a real button: focusable and keyboard-activated by the browser,
  // and typed so one inside a form does not submit it.
  it('makes every dot a labelled <button type="button">', () => {
    const dots = dotTags(html(<AnimatedTestimonials testimonials={testimonials} autoPlay={false} />))

    expect(dots).toHaveLength(3)
    for (const dot of dots) {
      expect(dot.startsWith('<button')).toBe(true)
      expect(dot).toContain('type="button"')
      expect(dot).toMatch(/aria-label="Go to testimonial \d"/)
      // The variant and every style prop compile to classes; any of these on
      // the element means they went out as attributes instead.
      for (const leak of [' active=', 'backgroundcolor=', 'hoverstyle=', 'cursor='])
        expect(dot, leak).not.toContain(leak)
    }
  })

  it('marks exactly one dot active, matching the shown testimonial', () => {
    const dots = dotTags(html(<AnimatedTestimonials testimonials={testimonials} autoPlay={false} />))

    expect(dots.filter((d) => d.includes('aria-current="true"'))).toHaveLength(1)
    expect(dots[0]).toContain('aria-current="true"')
  })

  it('lifts an 8px dot to the 44px touch floor', () => {
    const [dot] = dotTags(html(<AnimatedTestimonials testimonials={testimonials} autoPlay={false} />))

    expect(dot).toContain('data-touch-x="18"')
    expect(dot).toContain('data-touch-y="18"')
  })

  // The entrance is `hz-fade-up` on the card, and it only plays on mount — so
  // the card that shows the next slide has to be a NEW element, not the old
  // one with new text.
  it('moves to the clicked slide and remounts the card so the entrance plays', () => {
    const view = mount(<AnimatedTestimonials testimonials={testimonials} autoPlay={false} />)
    const before = view.card()

    expect(view.quote()).toContain('First quote')
    expect(before?.classList).toContain('hz-fade-up')

    act(() => {
      view.dots()[2].click()
    })

    expect(view.quote()).toContain('Third quote')
    expect(view.card()).not.toBe(before)
    expect(view.card()?.classList).toContain('hz-fade-up')
    expect(view.dots()[2].getAttribute('aria-current')).toBe('true')
    view.cleanup()
  })

  it('advances on its own and wraps when autoPlay is on, and holds still when it is off', () => {
    vi.useFakeTimers()
    const on = mount(<AnimatedTestimonials testimonials={testimonials} autoPlay duration={1000} />)
    expect(on.quote()).toContain('First quote')
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(on.quote()).toContain('Second quote')
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(on.quote()).toContain('First quote')
    on.cleanup()

    const off = mount(<AnimatedTestimonials testimonials={testimonials} autoPlay={false} duration={1000} />)
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(off.quote()).toContain('First quote')
    off.cleanup()
    vi.useRealTimers()
  })
})
