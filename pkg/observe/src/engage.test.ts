import { afterEach, beforeEach, describe as group, expect, it, vi } from 'vitest'
import { IDLE_MS } from './engage'
import { Observer } from './observer'
import type { Interaction } from './types'
import { deliver } from './wire'

let sink: Interaction[]
let engine: Observer | undefined
let now = 0
let visibility: DocumentVisibilityState = 'visible'
let focused = true

class FakeIO {
  static all: FakeIO[] = []
  watched = new Set<Element>()
  constructor(private cb: IntersectionObserverCallback) {
    FakeIO.all.push(this)
  }
  observe(el: Element) {
    this.watched.add(el)
  }
  unobserve(el: Element) {
    this.watched.delete(el)
  }
  disconnect() {
    this.watched.clear()
  }
  set(el: Element, seen: boolean) {
    const entry = {
      target: el,
      isIntersecting: seen,
      intersectionRatio: seen ? 1 : 0,
      intersectionRect: { height: seen ? 400 : 0 },
      rootBounds: { height: 900 },
    }
    this.cb([entry as unknown as IntersectionObserverEntry], this as never)
  }
}

/** The section clock: the observer made for the first watched section. */
const clock = () => FakeIO.all[FakeIO.all.length - 1]

beforeEach(() => {
  document.body.innerHTML = ''
  sink = []
  now = 1_000_000
  visibility = 'visible'
  focused = true
  FakeIO.all = []
  vi.stubGlobal('IntersectionObserver', FakeIO)
  vi.spyOn(Date, 'now').mockImplementation(() => now)
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility)
  vi.spyOn(document, 'hasFocus').mockImplementation(() => focused)
  vi.spyOn(performance, 'timeOrigin', 'get').mockReturnValue(0)
  vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0)
  history.replaceState(null, '', '/')
})

afterEach(() => {
  engine?.stop()
  engine = undefined
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function start(viewSelector = '[data-hz-view]'): Observer {
  engine = new Observer({ sink: (i) => sink.push(i), nav: false, viewSelector })
  engine.start()
  return engine
}

const leaves = () => sink.filter((i) => i.kind === 'leave')
const hide = () => {
  visibility = 'hidden'
  document.dispatchEvent(new Event('visibilitychange'))
}
const show = () => {
  visibility = 'visible'
  document.dispatchEvent(new Event('visibilitychange'))
}

group('engaged time', () => {
  it('reports a page view as $pageleave when the page is hidden, filed under that page', () => {
    history.replaceState(null, '', '/pricing?plan=pro')
    start()
    now += 4_000
    hide()
    const [l] = leaves()
    expect(l.name).toBe('$pageleave')
    expect(l.page).toEqual({ url: location.href, path: '/pricing' })
    expect(l.props).toMatchObject({ $seq: 0, $reason: 'hidden', $active_ms: 4_000, $elapsed_ms: 4_000 })
    expect(typeof l.props?.$view_id).toBe('string')
  })

  it('does not count hidden time, and a view that returns reports only what it added', () => {
    start()
    now += 3_000
    hide()
    now += 600_000 // away ten minutes
    show()
    now += 2_000
    window.dispatchEvent(new Event('pagehide'))
    const [a, b] = leaves()
    expect(a.props).toMatchObject({ $seq: 0, $active_ms: 3_000 })
    expect(b.props).toMatchObject({ $seq: 1, $reason: 'pagehide', $active_ms: 2_000 })
    expect(b.props?.$view_id).toBe(a.props?.$view_id)
    // The sum is the time on the page: 5 s, not 10 minutes.
    expect(leaves().reduce((t, l) => t + (l.props?.$active_ms as number), 0)).toBe(5_000)
  })

  it('does not count time without focus', () => {
    start()
    now += 1_000
    focused = false
    window.dispatchEvent(new Event('blur'))
    now += 30_000
    focused = true
    window.dispatchEvent(new Event('focus'))
    now += 1_000
    hide()
    expect(leaves()[0].props?.$active_ms).toBe(2_000)
  })

  it('stops counting a visitor who has done nothing for IDLE_MS, and resumes on input', () => {
    start()
    now += IDLE_MS + 300_000 // a tab left open on the desk
    window.dispatchEvent(new Event('pointermove'))
    now += 5_000
    hide()
    expect(leaves()[0].props?.$active_ms).toBe(IDLE_MS + 5_000)
  })

  it('sends nothing for a segment that added nothing', () => {
    start()
    now += 1_000
    hide()
    window.dispatchEvent(new Event('pagehide')) // hidden, then unloaded: one report
    expect(leaves()).toHaveLength(1)
  })

  it('sends one report when the page is unloaded and then hidden', () => {
    start()
    now += 1_000
    window.dispatchEvent(new Event('pagehide'))
    now += 5
    hide()
    expect(leaves()).toHaveLength(1)
    expect(leaves()[0].props).toMatchObject({ $reason: 'pagehide', $active_ms: 1_000 })
  })

  it('times each section while it is in view and the page is active', () => {
    document.body.innerHTML = '<section data-hz-view="hero"></section><section id="plans"></section><div data-hz-view="faq"></div>'
    start('[data-hz-view],section[id]')
    const [hero, plans] = Array.from(document.querySelectorAll('section'))
    clock().set(hero, true)
    now += 2_000
    clock().set(plans, true)
    now += 1_000
    clock().set(hero, false)
    now += 4_000
    hide()
    expect(leaves()[0].props?.$sections).toEqual({ hero: 3_000, plans: 5_000 })
  })

  it('ends the view on a route change, reports it under the page left, and starts the next', () => {
    history.replaceState(null, '', '/')
    start()
    now += 7_000
    history.pushState(null, '', '/pricing')
    now += 2_000
    hide()
    const [home, pricing] = leaves()
    expect(home.page?.path).toBe('/')
    expect(home.props).toMatchObject({ $reason: 'nav', $seq: 0, $active_ms: 7_000 })
    expect(pricing.page?.path).toBe('/pricing')
    expect(pricing.props).toMatchObject({ $seq: 0, $active_ms: 2_000 })
    expect(pricing.props?.$view_id).not.toBe(home.props?.$view_id)
  })

  it('carries the furthest the view was scrolled, and how much of the page that showed', () => {
    let y = 0
    vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => y)
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(4000)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1000)
    start()
    y = 1800
    window.dispatchEvent(new Event('scroll'))
    y = 200
    window.dispatchEvent(new Event('scroll'))
    hide()
    expect(leaves()[0].props).toMatchObject({ $scroll_max: 1800, $depth_max: 70, $page_height: 4000 })
  })

  it('reports the view under way when the engine stops', () => {
    start()
    now += 1_500
    engine!.stop()
    engine = undefined
    expect(leaves()[0].props).toMatchObject({ $reason: 'stop', $active_ms: 1_500 })
  })

  it('is the document engine’s alone', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    engine = new Observer({ sink: (i) => sink.push(i), nav: false, viewSelector: '', root: host })
    engine.start()
    now += 1_000
    hide()
    expect(leaves()).toHaveLength(0)
  })

  it('can be turned off', () => {
    engine = new Observer({ sink: (i) => sink.push(i), nav: false, viewSelector: '', engage: false })
    engine.start()
    now += 1_000
    hide()
    expect(leaves()).toHaveLength(0)
  })
})

group('deliver', () => {
  const client = () => {
    const calls: unknown[][] = []
    return {
      calls,
      pageview: (...a: unknown[]) => void calls.push(['pageview', ...a]),
      capture: (...a: unknown[]) => void calls.push(['capture', ...a]),
      flush: (...a: unknown[]) => void calls.push(['flush', ...a]),
    }
  }

  it('sends a hidden page’s leave at once, by beacon, under the page it measured', () => {
    start()
    now += 1_000
    hide()
    const c = client()
    deliver(c, leaves()[0])
    expect(c.calls[0][0]).toBe('capture')
    expect(c.calls[0][1]).toBe('$pageleave')
    expect(c.calls[0][3]).toEqual({ url: location.href, path: '/' })
    expect(c.calls[1]).toEqual(['flush', true])
  })

  it('lets a route change’s leave ride the next batch', () => {
    start()
    now += 1_000
    history.pushState(null, '', '/next')
    const c = client()
    deliver(c, leaves()[0])
    expect(c.calls.map((x) => x[0])).toEqual(['capture'])
  })
})
