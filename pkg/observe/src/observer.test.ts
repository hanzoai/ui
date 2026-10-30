import { afterEach, beforeEach, describe as group, expect, it, vi } from 'vitest'
import { attribution } from './annotate'
import { Observer } from './observer'
import type { Interaction } from './types'

let sink: Interaction[]
let engine: Observer | undefined

beforeEach(() => {
  document.body.innerHTML = ''
  sink = []
})

afterEach(() => {
  engine?.stop()
  engine = undefined
})

function start(config: Partial<ConstructorParameters<typeof Observer>[0]> = {}): Observer {
  engine = new Observer({ sink: (i) => sink.push(i), nav: false, viewSelector: '', engage: false, ...config })
  engine.start()
  return engine
}

group('Observer', () => {
  it('captures a click, annotated with the semantic hierarchy of the target', () => {
    document.body.innerHTML = '<section data-hz-name="Card"><button data-testid="save"><span>Save</span></button></section>'
    start()
    document.querySelector('span')!.dispatchEvent(new Event('click', { bubbles: true }))

    expect(sink).toHaveLength(1)
    const i = sink[0]
    expect(i.kind).toBe('click')
    expect(i.name).toBe('$click')
    expect(i.semantic.target.tag).toBe('span')
    expect(i.semantic.label).toBe('Card/button[save]')
  })

  it('mirrors every interaction into the playback stream', () => {
    document.body.innerHTML = '<button>x</button>'
    start()
    document.querySelector('button')!.dispatchEvent(new Event('click', { bubbles: true }))
    expect(engine!.stream.buffer()).toHaveLength(1)
    expect(engine!.stream.buffer()[0].kind).toBe('click')
  })

  it('redacts input values on change; withholds the raw text', () => {
    document.body.innerHTML = '<input name="password" type="password" value="hunter2">'
    start()
    document.querySelector('input')!.dispatchEvent(new Event('change', { bubbles: true }))
    expect(sink).toHaveLength(1)
    expect(sink[0].kind).toBe('change')
    expect(sink[0].value).toEqual({ redacted: true, kind: 'password' })
    expect(JSON.stringify(sink[0])).not.toContain('hunter2')
  })

  it('coalesces a burst of keystrokes into one debounced $input', () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<input name="q" value="">'
    start({ inputDebounceMs: 300 })
    const input = document.querySelector('input')!
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('input', { bubbles: true }))
    expect(sink).toHaveLength(0) // still within the debounce window
    vi.advanceTimersByTime(300)
    expect(sink).toHaveLength(1)
    expect(sink[0].kind).toBe('input')
    vi.useRealTimers()
  })

  it('debounces each field on its own, so a filled form reports every field', () => {
    // One shared debounce slot coalesced ACROSS elements: moving to the next
    // field cleared the previous field's pending timer, so a form filled at any
    // human speed reported only the last field touched. Caught in a browser,
    // where filling two fields in sequence produced one $input.
    vi.useFakeTimers()
    document.body.innerHTML = '<input name="email"><input name="q">'
    start({ inputDebounceMs: 300 })
    const [email, q] = Array.from(document.querySelectorAll('input'))
    email.dispatchEvent(new Event('input', { bubbles: true }))
    vi.advanceTimersByTime(50)
    q.dispatchEvent(new Event('input', { bubbles: true }))
    vi.advanceTimersByTime(300)

    expect(sink.map((i) => i.semantic.target.name)).toEqual(['email', 'q'])
    vi.useRealTimers()
  })

  it('a settled change supersedes that field’s pending input, and only that one', () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<input name="email"><select name="plan"><option>Pro</option></select>'
    start({ inputDebounceMs: 300 })
    const email = document.querySelector('input')!
    email.dispatchEvent(new Event('input', { bubbles: true }))
    document.querySelector('select')!.dispatchEvent(new Event('change', { bubbles: true }))
    vi.advanceTimersByTime(300)

    expect(sink.map((i) => i.kind)).toEqual(['change', 'input'])
    vi.useRealTimers()
  })

  it('never captures inside a private subtree', () => {
    document.body.innerHTML = '<div data-hz-private><button id="b">x</button></div>'
    start()
    document.getElementById('b')!.dispatchEvent(new Event('click', { bubbles: true }))
    expect(sink).toHaveLength(0)
  })

  it('captures SPA navigation as $pageview when nav is on', () => {
    start({ nav: true })
    history.pushState({}, '', '/dashboard')
    expect(sink).toHaveLength(1)
    expect(sink[0].kind).toBe('nav')
    expect(sink[0].name).toBe('$pageview')
    expect(typeof sink[0].props?.path).toBe('string')
  })

  it('stop() unbinds — no capture after stop', () => {
    document.body.innerHTML = '<button>x</button>'
    const e = start()
    e.stop()
    document.querySelector('button')!.dispatchEvent(new Event('click', { bubbles: true }))
    expect(sink).toHaveLength(0)
  })

  // ── one root, one engine ──────────────────────────────────────────────────
  // Delegated listeners mean a second engine on the same root reports every
  // interaction a second time. An app gets one by following two true sets of
  // instructions at once (a library's provider AND this package's own README),
  // and a doubled click is indistinguishable downstream from an engaged visitor.

  it('refuses a second engine on a root another already holds', () => {
    document.body.innerHTML = '<button>x</button>'
    const first = start()
    const second = new Observer({ sink: (i) => sink.push(i), nav: false, viewSelector: '' })
    second.start()

    expect(first.capturing).toBe(true)
    expect(second.capturing).toBe(false)

    document.querySelector('button')!.dispatchEvent(new Event('click', { bubbles: true }))
    expect(sink).toHaveLength(1)
    second.stop()
  })

  it('hands the root on once the holder stops', () => {
    document.body.innerHTML = '<button>x</button>'
    const first = start()
    first.stop()
    const second = new Observer({ sink: (i) => sink.push(i), nav: false, viewSelector: '' })
    second.start()
    expect(second.capturing).toBe(true)
    document.querySelector('button')!.dispatchEvent(new Event('click', { bubbles: true }))
    expect(sink).toHaveLength(1)
    second.stop()
  })

  it('claims per root, so a scoped engine coexists with a document-wide one', () => {
    document.body.innerHTML = '<section id="scope"><button>x</button></section>'
    const scoped = new Observer({
      sink: (i) => sink.push(i),
      root: document.getElementById('scope') as Element,
      nav: false,
      viewSelector: '',
    })
    scoped.start()
    const wide = start()
    expect(scoped.capturing).toBe(true)
    expect(wide.capturing).toBe(true)
    scoped.stop()
  })

  it('takes its defaults for keys a binding passed as undefined', () => {
    vi.useFakeTimers()
    try {
      document.body.innerHTML = '<input name="q" value=""><div data-hz-view="x"></div>'
      const e = start({ viewSelector: undefined, inputDebounceMs: undefined, maxDepth: undefined, nav: false })
      const input = document.querySelector('input')!
      input.dispatchEvent(new Event('input', { bubbles: true }))
      vi.advanceTimersByTime(399)
      expect(sink).toHaveLength(0) // the 400 ms default, not a 0 ms timer
      vi.advanceTimersByTime(1)
      expect(sink).toHaveLength(1)
      expect(sink[0].semantic.path.length).toBeGreaterThan(0)
      expect(e.capturing).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('keeps an explicit empty viewSelector as off', () => {
    const watched: Element[] = []
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe(el: Element) {
          watched.push(el)
        }
        unobserve() {}
        disconnect() {}
      },
    )
    document.body.innerHTML = '<div data-hz-view="x"></div>'
    start({ viewSelector: '' })
    expect(watched).toHaveLength(0)
    vi.unstubAllGlobals()
  })

  it('is fail-soft: a throwing sink never surfaces to the dispatcher', () => {
    document.body.innerHTML = '<button>x</button>'
    engine = new Observer({
      sink: () => {
        throw new Error('sink boom')
      },
      nav: false,
      viewSelector: '',
    })
    engine.start()
    expect(() =>
      document.querySelector('button')!.dispatchEvent(new Event('click', { bubbles: true })),
    ).not.toThrow()
  })
})

// A click's WHERE. Element identity says which thing was clicked; only a position
// can be drawn as a heat map, and the MouseEvent carrying it used to be discarded.
group('pointer position', () => {
  // detail is the click count a pointer press carries; 0 is a keyboard activation.
  function click(el: Element, init: MouseEventInit): void {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1, ...init }))
  }

  it('carries the pointer position and the viewport it was measured in', () => {
    document.body.innerHTML = '<button>x</button>'
    start()
    click(document.querySelector('button')!, { clientX: 120, clientY: 340 })

    expect(sink).toHaveLength(1)
    expect(sink[0].props).toMatchObject({
      $x: 120,
      $y: 340,
      $target_fixed: false,
      $viewport_width: window.innerWidth,
      $viewport_height: window.innerHeight,
    })
  })

  it('keeps the element identity it always had', () => {
    document.body.innerHTML = '<section data-hz-name="Card"><button data-testid="save">Save</button></section>'
    start()
    click(document.querySelector('button')!, { clientX: 1, clientY: 2 })
    expect(sink[0].semantic.label).toBe('Card/button[save]')
    expect(sink[0].props).toMatchObject({ $x: 1, $y: 2 })
  })

  it('measures a scrolled page in page coordinates', () => {
    document.body.innerHTML = '<button>x</button>'
    vi.spyOn(window, 'scrollX', 'get').mockReturnValue(15)
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(600)
    start()
    click(document.querySelector('button')!, { clientX: 10, clientY: 40 })
    expect(sink[0].props).toMatchObject({ $x: 25, $y: 640, $target_fixed: false })
    vi.restoreAllMocks()
  })

  it('measures a fixed target against the viewport it stays pinned to', () => {
    document.body.innerHTML = '<nav style="position:fixed"><button>x</button></nav>'
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(600)
    start()
    click(document.querySelector('button')!, { clientX: 10, clientY: 40 })
    expect(sink[0].props).toMatchObject({ $x: 10, $y: 40, $target_fixed: true })
    vi.restoreAllMocks()
  })

  it('contributes no position for an event that has no pointer', () => {
    document.body.innerHTML = '<button>x</button>'
    start()
    document.querySelector('button')!.dispatchEvent(new Event('click', { bubbles: true }))
    expect(sink).toHaveLength(1)
    expect(sink[0].props?.$x).toBeUndefined()
  })

  it('positions only a click — an input carries no coordinates', () => {
    document.body.innerHTML = '<input name="q" value="">'
    start()
    document.querySelector('input')!.dispatchEvent(new Event('change', { bubbles: true }))
    expect(sink[0].kind).toBe('change')
    expect(sink[0].props?.$x).toBeUndefined()
  })
})

// The rest of a heat map's position: where inside the element, and on how big a page.
group('pointer position, against the element and the page', () => {
  function click(el: Element, init: MouseEventInit): void {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1, ...init }))
  }

  function page(width: number, height: number): void {
    vi.spyOn(document.documentElement, 'scrollWidth', 'get').mockReturnValue(width)
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(height)
  }

  afterEach(() => vi.restoreAllMocks())

  it('places the pointer inside the target box, rounded', () => {
    document.body.innerHTML = '<button>x</button>'
    const button = document.querySelector('button')!
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({ left: 100.4, top: 300.6 } as DOMRect)
    start()
    click(button, { clientX: 120, clientY: 340 })
    expect(sink[0].props).toMatchObject({ $x: 120, $y: 340, $el_x: 20, $el_y: 39 })
  })

  it('carries the document size the position was measured on', () => {
    document.body.innerHTML = '<button>x</button>'
    page(1440, 9000)
    start()
    click(document.querySelector('button')!, { clientX: 1, clientY: 2 })
    expect(sink[0].props).toMatchObject({ $page_width: 1440, $page_height: 9000 })
  })

  it('gives a keyboard activation no position: a browser reports it at the origin with detail 0', () => {
    document.body.innerHTML = '<button>x</button>'
    start()
    document.querySelector('button')!.dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 0, clientX: 0, clientY: 0 }),
    )
    expect(sink).toHaveLength(1)
    for (const k of ['$x', '$y', '$el_x', '$el_y', '$page_width', '$page_height']) {
      expect(sink[0].props?.[k]).toBeUndefined()
    }
  })
})

// Where an interaction lands, beyond the element: the link it follows, its id, its section.
group('attribution', () => {
  function click(el: Element): void {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1, clientX: 5, clientY: 5 }))
  }

  it('names the link a click inside it follows, as a path with no query or fragment', () => {
    document.body.innerHTML = '<a href="/pricing?token=abc#plans"><span>Pricing</span></a>'
    start()
    click(document.querySelector('span')!)
    expect(sink[0].semantic.target.tag).toBe('span')
    expect(sink[0].props?.$href).toBe('/pricing')
    expect(JSON.stringify(sink[0].props)).not.toContain('token')
  })

  it('keeps another origin, and nothing past its path', () => {
    document.body.innerHTML = '<a href="https://github.com/hanzoai/ui?tab=readme#top">GitHub</a>'
    start()
    click(document.querySelector('a')!)
    expect(sink[0].props?.$href).toBe('https://github.com/hanzoai/ui')
  })

  it('names a link that is not http(s) by its scheme alone, never its address', () => {
    expect(attribution(mountOne('<a href="mailto:sales@hanzo.ai">Mail</a>')).$href).toBe('mailto:')
    expect(attribution(mountOne('<a href="tel:+15550100">Call</a>')).$href).toBe('tel:')
  })

  it('carries the target id, and the section by its data-hz-view value, else its id', () => {
    document.body.innerHTML =
      '<section id="plans"><div data-hz-view="pricing-cards"><button id="buy">Buy</button></div>' +
      '<button id="other">Other</button></section>'
    start()
    click(document.getElementById('buy')!)
    click(document.getElementById('other')!)
    expect(sink[0].props).toMatchObject({ $id: 'buy', $section: 'pricing-cards' })
    expect(sink[1].props).toMatchObject({ $id: 'other', $section: 'plans' })
  })

  it('passes over a marker that names nothing to the section around it', () => {
    expect(attribution(mountOne('<section id="faq"><div data-hz-view=""><p>x</p></div></section>', 'p')).$section).toBe('faq')
    expect(attribution(mountOne('<section><p>x</p></section>', 'p')).$section).toBeUndefined()
  })

  it('drops a reference over its bound rather than clipping it', () => {
    const long = 'a'.repeat(257)
    const where = attribution(mountOne(`<section id="${long}"><button id="${long}">x</button></section>`, 'button'))
    expect(where.$id).toBeUndefined()
    expect(where.$section).toBeUndefined()
    expect(attribution(mountOne(`<a href="/${'p'.repeat(256)}">x</a>`)).$href).toBeUndefined()
  })

  it('rides every interaction kind, not only a click', () => {
    document.body.innerHTML = '<section id="signup"><input id="email-field" name="q"></section>'
    start()
    document.querySelector('input')!.dispatchEvent(new Event('change', { bubbles: true }))
    expect(sink[0].kind).toBe('change')
    expect(sink[0].props).toMatchObject({ $id: 'email-field', $section: 'signup' })
  })

  function mountOne(html: string, sel?: string): Element {
    document.body.innerHTML = html
    return sel ? document.querySelector(sel)! : document.body.firstElementChild!
  }
})

// How far down a page a visitor got, once per milestone per page view.
group('scroll depth', () => {
  let y = 0
  let height = 4000

  beforeEach(() => {
    y = 0
    height = 4000
    vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => y)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1000)
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockImplementation(() => height)
    vi.spyOn(document.documentElement, 'scrollWidth', 'get').mockReturnValue(1440)
    history.replaceState({}, '', '/start')
  })

  afterEach(() => vi.restoreAllMocks())

  const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()))

  async function scrollTo(to: number): Promise<void> {
    y = to
    window.dispatchEvent(new Event('scroll'))
    await frame()
  }

  const depths = () => sink.filter((i) => i.kind === 'scroll').map((i) => i.props?.depth)

  it('reports each milestone once, as it is reached', async () => {
    start()
    await scrollTo(100) // the bottom of the window is 27.5% down
    expect(depths()).toEqual([25])
    await scrollTo(2000) // 75%
    expect(depths()).toEqual([25, 50, 75])
    await scrollTo(500)
    await scrollTo(2000)
    expect(depths()).toEqual([25, 50, 75])
    await scrollTo(3000) // the bottom of the page
    expect(depths()).toEqual([25, 50, 75, 100])
  })

  it('carries the depth, the name and the sizes it was measured against', async () => {
    start()
    await scrollTo(100)
    const i = sink.find((e) => e.kind === 'scroll')!
    expect(i.name).toBe('$scroll')
    expect(i.props).toMatchObject({
      depth: 25,
      $page_width: 1440,
      $page_height: 4000,
      $viewport_width: window.innerWidth,
      $viewport_height: 1000,
    })
  })

  it('counts the last pixel of a page as its bottom, whatever the rounding', async () => {
    start()
    await scrollTo(2999.5)
    expect(depths()).toEqual([25, 50, 75, 100])
  })

  it('measures once a frame, however many scroll events the frame held', async () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame')
    start()
    y = 1000
    for (let n = 0; n < 10; n++) window.dispatchEvent(new Event('scroll'))
    expect(raf).toHaveBeenCalledTimes(1)
    await frame()
    expect(depths()).toEqual([25, 50])
  })

  it('asks for no frame once the page view reached every milestone', async () => {
    start()
    await scrollTo(3000)
    const raf = vi.spyOn(window, 'requestAnimationFrame')
    window.dispatchEvent(new Event('scroll'))
    expect(raf).not.toHaveBeenCalled()
  })

  it('starts again on a new address, with nav capture off', async () => {
    start()
    await scrollTo(3000)
    history.pushState({}, '', '/pricing')
    height = 2000
    await scrollTo(10) // 50.5% of the shorter page
    expect(depths()).toEqual([25, 50, 75, 100, 25, 50])
  })

  it('does not count the top of a page, where a router puts every new one', async () => {
    height = 1500 // the top already shows two thirds of it
    start()
    await scrollTo(0)
    expect(depths()).toEqual([])
  })

  it('leaves the document scroll to the document engine', async () => {
    document.body.innerHTML = '<section id="scope"><button>x</button></section>'
    const scoped = new Observer({
      sink: (i) => sink.push(i),
      root: document.getElementById('scope') as Element,
      nav: false,
      viewSelector: '',
    })
    scoped.start()
    await scrollTo(3000)
    expect(depths()).toEqual([])
    scoped.stop()
  })

  it('stops measuring once stopped', async () => {
    start().stop()
    await scrollTo(3000)
    expect(depths()).toEqual([])
  })
})

// Several presses on one spot in quick succession: the visitor expected something to happen.
group('rage clicks', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  function press(el: Element, x: number, y: number, detail = 1): void {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail, clientX: x, clientY: y }))
  }

  const rages = () => sink.filter((i) => i.kind === 'rageclick')

  it('reports the third press inside a second and 30px, with the click’s position and annotation', () => {
    document.body.innerHTML = '<section id="hero"><button data-testid="cta">Go</button></section>'
    start()
    const b = document.querySelector('button')!
    press(b, 100, 100)
    vi.advanceTimersByTime(200)
    press(b, 110, 105)
    vi.advanceTimersByTime(200)
    expect(rages()).toHaveLength(0)
    press(b, 104, 112)
    expect(sink.map((i) => i.name)).toEqual(['$click', '$click', '$click', '$rageclick'])
    const r = rages()[0]
    expect(r.semantic.label).toBe('region/button[cta]')
    expect(r.props).toMatchObject({ $x: 104, $y: 112, $section: 'hero', $target_fixed: false })
  })

  it('reports a burst once, however long it goes on', () => {
    document.body.innerHTML = '<button>x</button>'
    start()
    const b = document.querySelector('button')!
    for (let n = 0; n < 8; n++) {
      press(b, 50, 50)
      vi.advanceTimersByTime(150)
    }
    expect(rages()).toHaveLength(1)
  })

  it('reports a second burst once the first has broken', () => {
    document.body.innerHTML = '<button>x</button>'
    start()
    const b = document.querySelector('button')!
    for (let n = 0; n < 3; n++) press(b, 50, 50)
    vi.advanceTimersByTime(1500)
    for (let n = 0; n < 3; n++) press(b, 50, 50)
    expect(rages()).toHaveLength(2)
  })

  it('is not presses too slow or too far apart', () => {
    document.body.innerHTML = '<button>x</button>'
    start()
    const b = document.querySelector('button')!
    press(b, 10, 10)
    vi.advanceTimersByTime(600)
    press(b, 10, 10)
    vi.advanceTimersByTime(600)
    press(b, 10, 10) // the first is 1.2 s old
    press(b, 200, 10)
    press(b, 10, 200)
    expect(rages()).toHaveLength(0)
  })

  it('is not keyboard activations, and not inside a private subtree', () => {
    document.body.innerHTML = '<button id="k">k</button><div data-hz-private><button id="p">p</button></div>'
    start()
    const k = document.getElementById('k')!
    for (let n = 0; n < 4; n++) press(k, 0, 0, 0)
    const p = document.getElementById('p')!
    for (let n = 0; n < 4; n++) press(p, 30, 30)
    expect(rages()).toHaveLength(0)
  })
})

// $view on sections that render after the engine started: a page's data-driven
// sections mount once their reads answer.
group('visibility of nodes mounted later', () => {
  class FakeIO {
    static all: FakeIO[] = []
    watched = new Set<Element>()
    constructor(
      private cb: IntersectionObserverCallback,
      readonly options?: IntersectionObserverInit,
    ) {
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
    show(el: Element, at: { ratio?: number; height?: number; viewport?: number } = {}) {
      const entry = {
        target: el,
        isIntersecting: true,
        intersectionRatio: at.ratio ?? 0.75,
        intersectionRect: { height: at.height ?? 0 },
        rootBounds: { height: at.viewport ?? 900 },
      }
      this.cb([entry as unknown as IntersectionObserverEntry], this as never)
    }
  }

  beforeEach(() => {
    FakeIO.all = []
    vi.stubGlobal('IntersectionObserver', FakeIO)
  })
  afterEach(() => vi.unstubAllGlobals())

  const tick = () => new Promise<void>((r) => setTimeout(r, 0))

  it('watches the matches in place at start, and every one mounted after it', async () => {
    document.body.innerHTML = '<div data-hz-view="hero"></div>'
    start({ viewSelector: '[data-hz-view]' })
    const io = FakeIO.all[0]
    expect([...io.watched].map((e) => e.getAttribute('data-hz-view'))).toEqual(['hero'])

    const wrap = document.createElement('div')
    wrap.innerHTML = '<section id="kai"><div data-hz-view="kai-board"></div></section>'
    document.body.appendChild(wrap)
    const late = document.createElement('div')
    late.setAttribute('data-hz-view', 'plans')
    document.body.appendChild(late)
    await tick()
    expect([...io.watched].map((e) => e.getAttribute('data-hz-view'))).toEqual(['hero', 'kai-board', 'plans'])

    io.show(late)
    expect(sink).toHaveLength(1)
    expect(sink[0].name).toBe('$view')
    expect(sink[0].props).toMatchObject({ ratio: 0.75, $section: 'plans' })
  })

  it('reports a view once and lets the node go, and lets a removed one go', async () => {
    document.body.innerHTML = '<div data-hz-view="a"></div><div id="b" data-hz-view="b"></div>'
    start({ viewSelector: '[data-hz-view]' })
    const io = FakeIO.all[0]
    const a = document.querySelector('[data-hz-view="a"]')!
    io.show(a)
    io.show(a)
    expect(sink).toHaveLength(1)
    expect(io.watched.has(a)).toBe(false)
    document.getElementById('b')!.remove()
    await tick()
    expect(io.watched.size).toBe(0)
  })

  it('sees a short element once half of it is in view, and not before', () => {
    document.body.innerHTML = '<div data-hz-view="card"></div>'
    start({ viewSelector: '[data-hz-view]' })
    const io = FakeIO.all[0]
    const card = document.querySelector('[data-hz-view]')!
    io.show(card, { ratio: 0.3, height: 120 })
    expect(sink).toHaveLength(0)
    expect(io.watched.has(card)).toBe(true)
    io.show(card, { ratio: 0.5, height: 200 })
    expect(sink.map((i) => i.props?.$section)).toEqual(['card'])
  })

  it('sees a section taller than two viewports once it covers half the viewport', () => {
    // 3,000px on an 844px phone: at most 28% of it is ever in view.
    document.body.innerHTML = '<section id="models" data-hz-view="models"></section>'
    start({ viewSelector: '[data-hz-view]' })
    const io = FakeIO.all[0]
    const tall = document.querySelector('section')!
    io.show(tall, { ratio: 0.1, height: 300, viewport: 844 })
    expect(sink).toHaveLength(0)
    io.show(tall, { ratio: 0.15, height: 450, viewport: 844 })
    expect(sink).toHaveLength(1)
    expect(sink[0].props).toMatchObject({ $section: 'models', ratio: 0.15 })
  })

  it('runs at a ratio inside every element’s half-a-viewport band, up to 32 viewports tall', () => {
    start({ viewSelector: '[data-hz-view]' })
    const steps = FakeIO.all[0].options!.threshold as number[]
    for (let k = 1; k <= 32; k += 0.5) {
      // covers half the viewport at 1/(2k); can reach no more than 1/k
      expect(steps.some((t) => t >= 1 / (2 * k) && t <= Math.min(1, 1 / k))).toBe(true)
    }
    expect(steps).toContain(0.5)
  })

  it('counts a section the reader scrolled past before the engine started, marked passed', () => {
    document.body.innerHTML = '<div data-hz-view="hero"></div><div data-hz-view="products"></div><div data-hz-view="plans"></div>'
    const [hero, products, plans] = Array.from(document.querySelectorAll('[data-hz-view]'))
    vi.spyOn(hero, 'getBoundingClientRect').mockReturnValue({ top: -2400, bottom: -1600, height: 800 } as DOMRect)
    vi.spyOn(products, 'getBoundingClientRect').mockReturnValue({ top: -1600, bottom: -20, height: 1580 } as DOMRect)
    vi.spyOn(plans, 'getBoundingClientRect').mockReturnValue({ top: -20, bottom: 700, height: 720 } as DOMRect)
    start({ viewSelector: '[data-hz-view]' })
    const views = sink.filter((i) => i.kind === 'view')
    expect(views.map((v) => v.props?.$section)).toEqual(['hero', 'products'])
    expect(views[0].props).toMatchObject({ passed: true })
    expect(views[0].props?.ratio).toBeUndefined()
    // Passed sections are watched no longer; the one in view still is.
    expect(FakeIO.all[0].watched.has(hero)).toBe(false)
    expect(FakeIO.all[0].watched.has(plans)).toBe(true)
    // And are not reported twice.
    FakeIO.all[0].show(products)
    expect(sink.filter((i) => i.kind === 'view')).toHaveLength(2)
  })

  it('infers nothing on a page opened at a fragment or restored by reload', () => {
    document.body.innerHTML = '<div data-hz-view="hero"></div>'
    vi.spyOn(document.querySelector('div')!, 'getBoundingClientRect').mockReturnValue({ top: -900, bottom: -10, height: 890 } as DOMRect)
    history.replaceState(null, '', '/#plans')
    start({ viewSelector: '[data-hz-view]' })
    expect(sink.filter((i) => i.kind === 'view')).toHaveLength(0)
    engine!.stop()
    engine = undefined
    history.replaceState(null, '', '/')
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([{ type: 'reload' }] as unknown as PerformanceEntryList)
    start({ viewSelector: '[data-hz-view]' })
    expect(sink.filter((i) => i.kind === 'view')).toHaveLength(0)
  })

  it('watches nothing added once stopped', async () => {
    start({ viewSelector: '[data-hz-view]' }).stop()
    document.body.innerHTML = '<div data-hz-view="x"></div>'
    await tick()
    expect(FakeIO.all[0].watched.size).toBe(0)
  })
})
