// The framework-agnostic capture engine. It installs a small set of delegated,
// passive listeners on a root (default: document), and for each real interaction
// derives the semantic hierarchy, applies the privacy gate, and emits an
// Interaction to two places: the session-playback stream (local) and the sink
// (the pipe — a @hanzo/event client, wired by a binding).
//
// Everything the engine does is wrapped so a capture failure can never surface in
// the host app: telemetry is strictly best-effort.

import { annotate } from './annotate'
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

/** WHERE the pointer was, which is what a heat map is drawn from — element identity
 *  says WHICH thing was clicked, never where on the page it sat.
 *
 *  Coordinates are the PAGE's, so a click keeps its place on a scrolled document.
 *  A fixed target is the exception: it does not move with the scroll, so adding the
 *  offset would drift it down the page by however far the visitor had scrolled.
 *  `$target_fixed` records which of the two a row was measured in, because the
 *  reader cannot tell them apart afterwards.
 *
 *  The viewport rides along because a position only means something against the
 *  window it was measured in — the read path scales x by it.
 *
 *  Total: a non-pointer event (a synthetic click, a keyboard activation) has no
 *  coordinates and contributes none, rather than a click at the origin. */
function positionOf(e: Event, el: Element | null): Record<string, unknown> | undefined {
  const m = e as MouseEvent
  if (typeof m.clientX !== 'number' || typeof m.clientY !== 'number') return undefined
  try {
    const fixed = isFixed(el)
    return {
      $x: Math.round(m.clientX + (fixed ? 0 : window.scrollX)),
      $y: Math.round(m.clientY + (fixed ? 0 : window.scrollY)),
      $target_fixed: fixed,
      $viewport_width: window.innerWidth,
      $viewport_height: window.innerHeight,
    }
  } catch {
    return undefined
  }
}

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
  private seen = new WeakSet<Element>()

  constructor(config: ObserveConfig) {
    this.cfg = {
      enabled: true,
      nav: true,
      viewSelector: '[data-hz-view]',
      inputDebounceMs: 400,
      maxDepth: 12,
      ...config,
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
    for (const t of this.pending.values()) clearTimeout(t)
    this.pending.clear()
    this.io?.disconnect()
    this.io = undefined
  }

  // ── listeners (arrow fields so they unbind cleanly) ────────────────────────

  private onClick = (e: Event) => {
    const el = elementOf(e.target)
    this.fire('click', el, positionOf(e, el))
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
    this.fire('nav', document.body, { path: location.pathname + location.search })
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
      this.io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            const el = entry.target
            if (this.seen.has(el)) continue
            this.seen.add(el)
            this.fire('view', el, { ratio: Math.round(entry.intersectionRatio * 100) / 100 })
          }
        },
        { threshold: 0.5 },
      )
      // Auto-observe the initial matches; ad-hoc nodes arrive via watch().
      const sel = this.cfg.viewSelector
      if (sel) (this.root as Document).querySelectorAll?.(sel).forEach((el) => this.io!.observe(el))
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
      const interaction: Interaction = { kind, name: NAME[kind], at: Date.now(), semantic, value, props }
      this.stream.emit(interaction)
      this.cfg.sink(interaction)
    } catch {
      /* fail-soft: telemetry must never break the app */
    }
  }
}
