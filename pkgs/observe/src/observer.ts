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

export class Observer {
  readonly stream: Stream<Interaction>
  private cfg: Required<Pick<ObserveConfig, 'enabled' | 'nav' | 'viewSelector' | 'inputDebounceMs' | 'maxDepth'>> &
    ObserveConfig
  private root: Document | Element
  private started = false
  private pending?: { el: Element; t: ReturnType<typeof setTimeout> }
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

  /** Install listeners. Idempotent and browser-only. */
  start(): void {
    if (this.started || !this.cfg.enabled || !isBrowser()) return
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

  /** Remove listeners and release resources. Idempotent. */
  stop(): void {
    if (!this.started) return
    this.started = false
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
    if (this.pending) {
      clearTimeout(this.pending.t)
      this.pending = undefined
    }
    this.io?.disconnect()
    this.io = undefined
  }

  // ── listeners (arrow fields so they unbind cleanly) ────────────────────────

  private onClick = (e: Event) => this.fire('click', elementOf(e.target))

  private onInput = (e: Event) => {
    const el = elementOf(e.target)
    if (!el) return
    if (this.pending) clearTimeout(this.pending.t)
    this.pending = {
      el,
      t: setTimeout(() => {
        this.pending = undefined
        this.fire('input', el)
      }, this.cfg.inputDebounceMs),
    }
  }

  private onChange = (e: Event) => {
    if (this.pending) {
      clearTimeout(this.pending.t)
      this.pending = undefined
    }
    this.fire('change', elementOf(e.target))
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
