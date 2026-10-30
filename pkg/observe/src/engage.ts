// Engaged time: how long a page view held the visitor, and how long each section of
// it did. Reported as `$pageleave`.
//
// ACTIVE means the document was visible, the window had focus, and the visitor did
// something (pointer, key, wheel, touch, scroll) inside the last IDLE_MS. Visible
// and focused is the definition; the idle bound keeps a tab left open on a desk
// overnight from reading as eight hours on the pricing page.
//
// A SECTION is an element the engine watches for `$view` (`[data-hz-view]`, named
// by that attribute or its id). It is active while the page is and while it is in
// view by the same rule as `$view`: half of it in view, or what is in view of it
// covering half the viewport.
//
// A LEAVE IS REPORTED IN SEGMENTS. The page going hidden is the last moment a phone
// reliably runs script (`pagehide` often never comes), so a view reports when it is
// hidden, when the router leaves it, when it is unloaded, and when the engine
// stops. A view that comes back reports again carrying only what it added since.
// The time on a page view is therefore the SUM of `$active_ms` over its
// `$view_id`, and no millisecond is counted twice. `$scroll_max` and `$depth_max`
// are the view's running maxima, so its last segment holds the final ones.
//
// A segment is filed under the page it measured (`page`), not the address bar:
// the router has already moved by the time a navigation is noticed.

import { vitals, type Vitals } from './vitals'

/** No input for this long and the visitor is no longer counted as engaged. */
export const IDLE_MS = 60_000

/** Seen: half of the element is in view, or what is in view of it covers half the
 *  viewport. The second is the only way an element taller than two viewports — a
 *  landing section on a phone — can ever be seen: half of it never fits. */
export function inView(e: IntersectionObserverEntry): boolean {
  if (e.intersectionRatio >= 0.5) return true
  const viewport = e.rootBounds?.height ?? window.innerHeight
  return viewport > 0 && e.intersectionRect.height >= viewport / 2
}

/** The ratios a visibility callback runs at. An element k viewports tall covers
 *  half the viewport once its ratio reaches 1/(2k), and each step is at most
 *  double the one before it, so one always falls between that and the 1/k it can
 *  reach: every element up to 32 viewports tall is caught, and the first
 *  half-in-view of a short one is the 1/2 step. */
export const VIEW_STEPS = [0, 1 / 64, 1 / 32, 1 / 16, 1 / 8, 1 / 4, 1 / 2, 1]

/** Why a segment was reported. */
export type LeaveReason = 'hidden' | 'pagehide' | 'nav' | 'stop'

/** One reported segment: the page it belongs to and its properties. */
export interface Leave {
  page: { url: string; path: string }
  props: Record<string, unknown>
}

/** The address a page view is: its path and query, never its fragment. */
export function pageKey(): string {
  return location.pathname + location.search
}

const ACTIVITY = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'] as const

function viewId(): string {
  const r = Math.random().toString(36).slice(2, 10)
  return Date.now().toString(36) + r
}

export class Engagement {
  private key = ''
  private page = { url: '', path: '' }
  private id = ''
  private seq = 0
  private began = 0
  /** The clock: the last moment counted up to, and the last moment of input. */
  private last = 0
  private input = 0
  /** Visible and focused, as of `last`. */
  private on = false
  private active = 0
  private sections = new Map<string, number>()
  private scrollMax = 0
  private sentScroll = -1
  private shown = new Map<Element, string>()
  private io?: IntersectionObserver
  private perf?: Vitals
  private running = false

  constructor(
    private emit: (leave: Leave) => void,
    private nameOf: (el: Element) => string | undefined,
  ) {}

  /** Begin the first view: the page as loaded. Its clock starts at navigation,
   *  so the time before the engine started counts. */
  start(): void {
    if (this.running) return
    this.running = true
    const origin = typeof performance !== 'undefined' && performance.timeOrigin ? performance.timeOrigin : 0
    this.begin(origin > 0 && origin <= Date.now() ? Math.floor(origin) : Date.now())
    this.perf = vitals()
    document.addEventListener('visibilitychange', this.onVisibility)
    window.addEventListener('focus', this.onFocus)
    window.addEventListener('blur', this.onFocus)
    window.addEventListener('pagehide', this.onPageHide)
    window.addEventListener('scroll', this.onScroll, { passive: true })
    for (const t of ACTIVITY) window.addEventListener(t, this.onInput, { capture: true, passive: true })
  }

  /** Report what is left and let go of everything. */
  stop(): void {
    if (!this.running) return
    this.leave('stop')
    this.running = false
    document.removeEventListener('visibilitychange', this.onVisibility)
    window.removeEventListener('focus', this.onFocus)
    window.removeEventListener('blur', this.onFocus)
    window.removeEventListener('pagehide', this.onPageHide)
    window.removeEventListener('scroll', this.onScroll)
    for (const t of ACTIVITY) window.removeEventListener(t, this.onInput, { capture: true } as EventListenerOptions)
    this.io?.disconnect()
    this.io = undefined
    this.shown.clear()
    this.perf?.stop()
    this.perf = undefined
  }

  /** Time a section. The observer is made for the first one, so a page with no
   *  sections holds none. */
  watch(el: Element): void {
    if (!this.running) return
    try {
      if (!this.io && typeof IntersectionObserver !== 'undefined') {
        this.io = new IntersectionObserver(this.onSections, { threshold: VIEW_STEPS })
      }
      this.io?.observe(el)
    } catch {
      /* sections are optional */
    }
  }

  /** Stop timing a section that left the tree. */
  forget(el: Element): void {
    try {
      this.io?.unobserve(el)
      if (this.shown.has(el)) {
        this.tick(Date.now())
        this.shown.delete(el)
      }
    } catch {
      /* no-op */
    }
  }

  /** The address may have changed: a new address is a new view, and the one left
   *  reports first. */
  route(): void {
    if (!this.running) return
    try {
      if (pageKey() === this.key) return
      this.leave('nav')
      this.perf?.stop()
      this.perf = undefined
      this.begin(Date.now())
    } catch {
      /* fail-soft */
    }
  }

  private begin(t: number): void {
    this.key = pageKey()
    this.page = { url: location.href, path: location.pathname }
    this.id = viewId()
    this.seq = 0
    this.began = t
    this.last = t
    this.input = t
    this.on = this.live()
    this.active = 0
    this.sections.clear()
    this.scrollMax = Math.max(0, Math.round(window.scrollY || 0))
    this.sentScroll = -1
  }

  private live(): boolean {
    const visible = document.visibilityState !== 'hidden'
    const focused = typeof document.hasFocus === 'function' ? document.hasFocus() : true
    return visible && focused
  }

  /** Count from `last` to `t`: active time, and each section in view meanwhile. */
  private tick(t: number): void {
    const from = this.last
    this.last = Math.max(from, t)
    if (!this.on) return
    const until = Math.min(t, this.input + IDLE_MS)
    const dt = until - from
    if (dt <= 0) return
    this.active += dt
    for (const name of new Set(this.shown.values())) this.sections.set(name, (this.sections.get(name) ?? 0) + dt)
  }

  /** Count up to now, then take the new state. */
  private settle = () => {
    this.tick(Date.now())
    this.on = this.live()
  }

  private onFocus = () => this.settle()

  private onVisibility = () => {
    this.settle()
    if (document.visibilityState === 'hidden') this.leave('hidden')
    // Back from hidden: what was idle while hidden is not the visitor's absence.
    else this.input = Date.now()
  }

  /** Unloading: report, then stop the clock, so the `visibilitychange` a browser
   *  fires beside `pagehide` finds nothing new and sends nothing. A page restored
   *  from the back-forward cache is visible again and counts from there. */
  private onPageHide = () => {
    this.leave('pagehide')
    this.on = false
  }

  private onInput = () => {
    const t = Date.now()
    if (t - this.input > IDLE_MS) this.tick(t)
    this.input = t
  }

  private onScroll = () => {
    this.onInput()
    const y = window.scrollY
    if (y > this.scrollMax) this.scrollMax = Math.round(y)
  }

  private onSections = (entries: IntersectionObserverEntry[]) => {
    try {
      this.tick(Date.now())
      for (const e of entries) {
        const name = this.nameOf(e.target)
        if (!name) continue
        if (e.isIntersecting && inView(e)) this.shown.set(e.target, name)
        else this.shown.delete(e.target)
      }
    } catch {
      /* fail-soft */
    }
  }

  /** Report the segment since the last one. A view reports at least once; after
   *  that, a segment that added nothing is not sent. */
  private leave(reason: LeaveReason): void {
    try {
      const t = Date.now()
      this.tick(t)
      const fresh = this.active > 0 || this.sections.size > 0 || this.scrollMax !== this.sentScroll
      if (this.seq > 0 && !fresh) return
      const d = document.documentElement
      const height = d.scrollHeight
      const vh = window.innerHeight
      const props: Record<string, unknown> = {
        $view_id: this.id,
        $seq: this.seq,
        $reason: reason,
        $active_ms: Math.round(this.active),
        $elapsed_ms: Math.max(0, t - this.began),
        $scroll_max: this.scrollMax,
        $depth_max: height > 0 ? Math.min(100, Math.round(((this.scrollMax + vh) / height) * 100)) : 0,
        $page_width: d.scrollWidth,
        $page_height: height,
        $viewport_width: window.innerWidth,
        $viewport_height: vh,
      }
      if (this.sections.size > 0) {
        const s: Record<string, number> = {}
        for (const [name, ms] of this.sections) s[name] = Math.round(ms)
        props.$sections = s
      }
      if (this.perf) Object.assign(props, this.perf.read())
      this.seq++
      this.active = 0
      this.sections.clear()
      this.sentScroll = this.scrollMax
      this.emit({ page: { ...this.page }, props })
    } catch {
      /* fail-soft: telemetry must never break the app */
    }
  }
}
