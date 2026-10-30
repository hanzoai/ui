// The framework-agnostic capture engine. It installs a small set of delegated,
// passive listeners on a root (default: document), and for each real interaction
// derives the semantic hierarchy, applies the privacy gate, and emits an
// Interaction to two places: the session-playback stream (local) and the sink
// (the pipe — a @hanzo/event client, wired by a binding).
//
// Everything the engine does is wrapped so a capture failure can never surface in
// the host app: telemetry is strictly best-effort.

import { annotate, attribution } from './annotate'
import { isPrivate, redactValue } from './redact'
import { Stream } from './stream'
import type { Interaction, InteractionKind, ObserveConfig } from './types'

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined'

// ── one root, one engine ────────────────────────────────────────────────────
//
// The engine installs DELEGATED listeners on a root — `document`, normally — so
// two running engines on one root capture every interaction TWICE. That is not
// hypothetical: it is what an app gets by following two true sets of
// instructions at once. @hanzogui/telemetry's provider starts an engine, and
// this package's own README told apps to mount `<ObserveProvider/>`; a tree with
// both doubled every click, and a doubled click is indistinguishable downstream
// from an engaged visitor.
//
// The claim lives on the PAGE, under a registry `Symbol.for` resolves, not in
// module scope: two copies of this package in one bundle have two module scopes
// and would not see each other's claim at all — which is precisely the case
// where a duplicate is most likely. A well-known symbol is the one slot every
// copy resolves to the same value.
//
// First to start wins and keeps the root until it stops; a later engine stays
// inert (`capturing === false`) rather than throwing, because a second provider
// is a wiring accident, not an app error.
const REGISTRY = Symbol.for('hanzo.observe.roots')

function claimed(): Set<unknown> {
  const g = globalThis as unknown as Record<symbol, Set<unknown> | undefined>
  const existing = g[REGISTRY]
  if (existing) return existing
  const fresh = new Set<unknown>()
  g[REGISTRY] = fresh
  return fresh
}

/** Reserved autocapture event name per kind — the same $-prefixed vocabulary the
 *  server read lens expects ($pageview is already the pageview name). */
const NAME: Record<InteractionKind, string> = {
  click: '$click',
  input: '$input',
  change: '$change',
  submit: '$submit',
  nav: '$pageview',
  view: '$view',
  scroll: '$scroll',
  rageclick: '$rageclick',
}

/** SPA-navigation notifier. history.pushState/replaceState don't emit an event, so
 *  we patch them once (process-wide) to dispatch one, ref-counted so the last
 *  Observer to stop restores the originals. */
const HISTORY_EVENT = 'hz:navigate'
let histRefs = 0
let histOriginals: { push: History['pushState']; replace: History['replaceState'] } | null = null

function installHistory(): void {
  if (!isBrowser()) return
  histRefs++
  if (histOriginals) return
  const push = history.pushState
  const replace = history.replaceState
  histOriginals = { push, replace }
  const fire = () => {
    try {
      window.dispatchEvent(new Event(HISTORY_EVENT))
    } catch {
      /* no-op */
    }
  }
  history.pushState = function (this: History, ...args: Parameters<History['pushState']>) {
    const r = push.apply(this, args)
    fire()
    return r
  }
  history.replaceState = function (this: History, ...args: Parameters<History['replaceState']>) {
    const r = replace.apply(this, args)
    fire()
    return r
  }
}

function uninstallHistory(): void {
  if (histRefs > 0) histRefs--
  if (histRefs === 0 && histOriginals) {
    history.pushState = histOriginals.push
    history.replaceState = histOriginals.replace
    histOriginals = null
  }
}

/** The address a page view is: its path and query, never its fragment. */
function pageKey(): string {
  return location.pathname + location.search
}

/** Resolve the Element an event landed on (text nodes → their parent). */
function elementOf(target: EventTarget | null): Element | null {
  if (target && (target as Node).nodeType === 1) return target as Element
  if (target && (target as Node).nodeType === 3) return (target as Node).parentElement
  return null
}

/** How far up the tree a fixed ancestor is looked for. Bounded because this runs a
 *  style resolution per level. */
const FIXED_DEPTH = 12

/** Whether the target stays put when the page scrolls. */
function isFixed(el: Element | null): boolean {
  for (let n = el, d = 0; n && d < FIXED_DEPTH; n = n.parentElement, d++) {
    const p = getComputedStyle(n).position
    if (p === 'fixed' || p === 'sticky') return true
  }
  return false
}

/** The document's own size. A position is drawn against the page it was measured
 *  on, and a page whose layout changed is a different height: the reader normalises
 *  by it. */
function pageSize(): { $page_width: number; $page_height: number } {
  const d = document.documentElement
  return { $page_width: d.scrollWidth, $page_height: d.scrollHeight }
}

/** WHERE the pointer was, which is what a heat map is drawn from — element identity
 *  says WHICH thing was clicked, never where on the page it sat.
 *
 *  Coordinates are the PAGE's, so a click keeps its place on a scrolled document.
 *  A fixed target is the exception: it does not move with the scroll, so adding the
 *  offset would drift it down the page by however far the visitor had scrolled.
 *  `$target_fixed` records which of the two a row was measured in, because the
 *  reader cannot tell them apart afterwards.
 *
 *  The viewport and the document ride along because a position only means
 *  something against the window and the page it was measured in — the read path
 *  scales x by the one and y by the other. `$el_x`/`$el_y` place the pointer inside
 *  the target's own box, so a click can be redrawn on the element after the page
 *  around it moved.
 *
 *  Total: a non-pointer event (a synthetic click, a keyboard activation) has no
 *  coordinates and contributes none, rather than a click at the origin. A browser
 *  gives a keyboard activation, an `el.click()` and a label's forwarded click
 *  clientX 0 and clientY 0, and `detail` 0 — the click count, which is at least 1
 *  for anything a pointer pressed — so `detail` is what tells them apart. */
function positionOf(e: Event, el: Element | null): Record<string, unknown> | undefined {
  const m = e as MouseEvent
  if (typeof m.clientX !== 'number' || typeof m.clientY !== 'number' || !m.detail) return undefined
  try {
    const fixed = isFixed(el)
    const box = el?.getBoundingClientRect()
    return {
      $x: Math.round(m.clientX + (fixed ? 0 : window.scrollX)),
      $y: Math.round(m.clientY + (fixed ? 0 : window.scrollY)),
      ...(box ? { $el_x: Math.round(m.clientX - box.left), $el_y: Math.round(m.clientY - box.top) } : {}),
      $target_fixed: fixed,
      $viewport_width: window.innerWidth,
      $viewport_height: window.innerHeight,
      ...pageSize(),
    }
  } catch {
    return undefined
  }
}

/** The share of the document a visitor has scrolled to, as the milestones a
 *  `$scroll` reports. Each fires once a page view: the reach of a page, not how
 *  often someone scrolled it. */
const DEPTHS = [25, 50, 75, 100] as const

/** Seen: half of the element is in view, or what is in view of it covers half the
 *  viewport. The second is the only way an element taller than two viewports — a
 *  landing section on a phone — can ever be seen: half of it never fits. */
function inView(e: IntersectionObserverEntry): boolean {
  if (e.intersectionRatio >= 0.5) return true
  const viewport = e.rootBounds?.height ?? window.innerHeight
  return viewport > 0 && e.intersectionRect.height >= viewport / 2
}

/** The ratios a callback runs at. An element k viewports tall covers half the
 *  viewport once its ratio reaches 1/(2k), and each step is at most double the one
 *  before it, so one always falls between that and the 1/k it can reach: every
 *  element up to 32 viewports tall is caught, and the first half-in-view of a
 *  short one is the 1/2 step. */
const VIEW_STEPS = [0, 1 / 64, 1 / 32, 1 / 16, 1 / 8, 1 / 4, 1 / 2, 1]

/** A rage click: this many presses, inside this long, inside this far of the last
 *  one. Reported once a burst, on the press that makes it one. */
const RAGE_CLICKS = 3
const RAGE_MS = 1000
const RAGE_PX = 30

export class Observer {
  readonly stream: Stream<Interaction>
  private cfg: Required<Pick<ObserveConfig, 'enabled' | 'nav' | 'viewSelector' | 'inputDebounceMs' | 'maxDepth'>> &
    ObserveConfig
  private root: Document | Element
  private started = false
  /** In-flight input debounces, keyed BY FIELD. One shared slot coalesced across
   *  elements: typing in a second field cleared the first field's pending timer,
   *  so filling a form reported only the last field touched and every field
   *  before it vanished. The debounce is per field because that is what it is
   *  for — collapsing one field's keystrokes, not one form's fields. */
  private pending = new Map<Element, ReturnType<typeof setTimeout>>()
  private io?: IntersectionObserver
  private mo?: MutationObserver
  private seen = new WeakSet<Element>()
  /** The page view the scroll milestones belong to, and the ones it reached. */
  private page = ''
  private reached = new Set<number>()
  private frame = 0
  /** The pointer presses of the burst under way, and whether it was reported. */
  private presses: { t: number; x: number; y: number }[] = []
  private raged = false

  constructor(config: ObserveConfig) {
    // Each default is taken where the caller left a key unset OR set it to
    // undefined. A binding passes its props straight through, an omitted one
    // as `undefined`, and a spread of that object over the defaults put the
    // undefined in their place: no provider ever watched [data-hz-view].
    this.cfg = {
      ...config,
      enabled: config.enabled ?? true,
      nav: config.nav ?? true,
      viewSelector: config.viewSelector ?? '[data-hz-view]',
      inputDebounceMs: config.inputDebounceMs ?? 400,
      maxDepth: config.maxDepth ?? 12,
    }
    this.root = config.root ?? (isBrowser() ? document : ({} as Document))
    this.stream = new Stream<Interaction>(config.bufferSize ?? 500)
  }

  /** Whether this engine holds its root and is capturing. False for a second
   *  engine on an already-claimed root — see the registry above. */
  get capturing(): boolean {
    return this.started
  }

  /** Install listeners. Idempotent, browser-only, and refused when another
   *  engine already holds this root. */
  start(): void {
    if (this.started || !this.cfg.enabled || !isBrowser()) return
    const roots = claimed()
    if (roots.has(this.root)) return
    roots.add(this.root)
    this.started = true
    const r = this.root as Document
    r.addEventListener('click', this.onClick, { capture: true, passive: true })
    r.addEventListener('input', this.onInput, { capture: true, passive: true })
    r.addEventListener('change', this.onChange, { capture: true, passive: true })
    r.addEventListener('submit', this.onSubmit, { capture: true, passive: true })
    if (this.cfg.nav) {
      installHistory()
      window.addEventListener('popstate', this.onNav)
      window.addEventListener(HISTORY_EVENT, this.onNav)
    }
    // The document's scroll is the document engine's alone: a scoped engine
    // beside it would report every milestone a second time.
    if (this.root === document && typeof requestAnimationFrame === 'function') {
      this.page = pageKey()
      window.addEventListener('scroll', this.onScroll, { passive: true })
    }
    this.installView()
  }

  /** Remove listeners, release the root, and free resources. Idempotent. */
  stop(): void {
    if (!this.started) return
    this.started = false
    claimed().delete(this.root)
    const r = this.root as Document
    r.removeEventListener('click', this.onClick, { capture: true } as EventListenerOptions)
    r.removeEventListener('input', this.onInput, { capture: true } as EventListenerOptions)
    r.removeEventListener('change', this.onChange, { capture: true } as EventListenerOptions)
    r.removeEventListener('submit', this.onSubmit, { capture: true } as EventListenerOptions)
    if (this.cfg.nav) {
      window.removeEventListener('popstate', this.onNav)
      window.removeEventListener(HISTORY_EVENT, this.onNav)
      uninstallHistory()
    }
    window.removeEventListener('scroll', this.onScroll)
    if (this.frame) cancelAnimationFrame(this.frame)
    this.frame = 0
    this.reached.clear()
    this.presses = []
    for (const t of this.pending.values()) clearTimeout(t)
    this.pending.clear()
    this.io?.disconnect()
    this.io = undefined
    this.mo?.disconnect()
    this.mo = undefined
  }

  // ── listeners (arrow fields so they unbind cleanly) ────────────────────────

  private onClick = (e: Event) => {
    const el = elementOf(e.target)
    const at = positionOf(e, el)
    this.fire('click', el, at)
    if (at) this.rage(e as MouseEvent, el, at)
  }

  /** Count a pointer press toward a rage click. Presses are kept while they are
   *  inside RAGE_MS of now and RAGE_PX of this one, in the viewport (a burst the
   *  page scrolled under is not one spot); the press that makes RAGE_CLICKS is
   *  reported, and the burst is not reported again until it breaks. */
  private rage(m: MouseEvent, el: Element | null, at: Record<string, unknown>): void {
    const t = Date.now()
    const x = m.clientX
    const y = m.clientY
    this.presses = this.presses.filter((p) => t - p.t <= RAGE_MS && Math.hypot(p.x - x, p.y - y) <= RAGE_PX)
    this.presses.push({ t, x, y })
    if (this.presses.length === 1) this.raged = false
    if (this.presses.length < RAGE_CLICKS || this.raged) return
    this.raged = true
    this.fire('rageclick', el, at)
  }

  /** Scroll is measured a frame later, once a frame: the handler only asks for the
   *  frame, and the frame only READS (scroll offset, window, document height), so
   *  nothing here forces a layout a write made dirty. A page view that has reached
   *  every milestone asks for no frames at all. */
  private onScroll = () => {
    if (this.frame) return
    if (this.reached.size === DEPTHS.length && this.page === pageKey()) return
    this.frame = requestAnimationFrame(this.measure)
  }

  private measure = () => {
    this.frame = 0
    try {
      // A new address is a new page view, whether or not anything counted the
      // navigation: the milestones start again.
      const page = pageKey()
      if (page !== this.page) {
        this.page = page
        this.reached.clear()
      }
      // The top of the page is what every visitor sees without scrolling, and a
      // router puts the next page there on its own: reaching it is not a scroll.
      if (window.scrollY <= 0) return
      const size = pageSize()
      if (!size.$page_height) return
      const bottom = window.scrollY + window.innerHeight
      const share = bottom >= size.$page_height - 1 ? 100 : (bottom / size.$page_height) * 100
      for (const depth of DEPTHS) {
        if (share < depth || this.reached.has(depth)) continue
        this.reached.add(depth)
        this.fire('scroll', document.body, {
          depth,
          ...size,
          $viewport_width: window.innerWidth,
          $viewport_height: window.innerHeight,
        })
      }
    } catch {
      /* fail-soft */
    }
  }

  private onInput = (e: Event) => {
    const el = elementOf(e.target)
    if (!el) return
    const running = this.pending.get(el)
    if (running !== undefined) clearTimeout(running)
    this.pending.set(
      el,
      setTimeout(() => {
        this.pending.delete(el)
        this.fire('input', el)
      }, this.cfg.inputDebounceMs),
    )
  }

  private onChange = (e: Event) => {
    const el = elementOf(e.target)
    // A change on a field supersedes its own pending $input — it is the same
    // edit, settled. Other fields keep theirs.
    if (el) {
      const running = this.pending.get(el)
      if (running !== undefined) {
        clearTimeout(running)
        this.pending.delete(el)
      }
    }
    this.fire('change', el)
  }

  private onSubmit = (e: Event) => this.fire('submit', elementOf(e.target))

  private onNav = () => {
    if (!isBrowser()) return
    this.fire('nav', document.body, { path: pageKey() })
  }

  /** Watch an element for visibility ($view) — for nodes marked after start()
   *  (e.g. by a framework binding). No-op when visibility capture is unavailable. */
  watch(el: Element): void {
    try {
      this.io?.observe(el)
    } catch {
      /* no-op */
    }
  }

  private installView(): void {
    if (typeof IntersectionObserver === 'undefined') return
    try {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting || !inView(entry)) continue
            const el = entry.target
            // Reported once, so it is watched no longer.
            io.unobserve(el)
            if (this.seen.has(el)) continue
            this.seen.add(el)
            this.fire('view', el, { ratio: Math.round(entry.intersectionRatio * 100) / 100 })
          }
        },
        { threshold: VIEW_STEPS },
      )
      this.io = io
      const sel = this.cfg.viewSelector
      if (!sel) return
      // `el` and every match beneath it, watched or let go.
      const each = (el: Element, act: (n: Element) => void) => {
        if (el.matches(sel)) act(el)
        el.querySelectorAll(sel).forEach(act)
      }
      const watch = (n: Element) => io.observe(n)
      const forget = (n: Element) => io.unobserve(n)
      // The matches already in the tree, then every one mounted later: a section
      // that renders once its data answers is in no tree start() could have read.
      // Only the roots a mutation added or removed are searched, never the whole
      // document, and a removed match is let go so a long session holds no
      // detached nodes.
      const root = this.root as Document
      root.querySelectorAll?.(sel).forEach(watch)
      if (typeof MutationObserver === 'undefined') return
      this.mo = new MutationObserver((records) => {
        try {
          for (const r of records) {
            r.addedNodes.forEach((n) => n.nodeType === 1 && each(n as Element, watch))
            r.removedNodes.forEach((n) => n.nodeType === 1 && each(n as Element, forget))
          }
        } catch {
          /* fail-soft */
        }
      })
      this.mo.observe(root, { childList: true, subtree: true })
    } catch {
      /* visibility capture is optional */
    }
  }

  /** Build and dispatch an Interaction. The single choke point; fully guarded. */
  private fire(kind: InteractionKind, el: Element | null, props?: Record<string, unknown>): void {
    if (!this.cfg.enabled) return
    try {
      if (!el || isPrivate(el, this.cfg.redaction)) return
      const semantic = annotate(el, { maxDepth: this.cfg.maxDepth })
      const value = kind === 'input' || kind === 'change' ? redactValue(el, this.cfg.redaction) : undefined
      const where = attribution(el)
      const all = props || Object.keys(where).length ? { ...where, ...props } : undefined
      const interaction: Interaction = { kind, name: NAME[kind], at: Date.now(), semantic, value, props: all }
      this.stream.emit(interaction)
      this.cfg.sink(interaction)
    } catch {
      /* fail-soft: telemetry must never break the app */
    }
  }
}
