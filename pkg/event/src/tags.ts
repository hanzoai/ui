// First-party consent & server-managed tag bridge for Hanzo Analytics.
//
// Open-source @hanzo/event never embeds third-party ad network loaders, SDK
// URLs, or pixel IDs. It talks strictly to the configured first-party Hanzo
// Analytics / Cloud endpoint (`GET /v1/project/tags` for the visitor's regional
// consent rule and audience classification, and `POST /v1/event` for the
// first-party event stream).
//
// When the first-party server reports active project tags for a consenting
// visitor, it delegates dynamic tag execution exclusively to the server-hosted
// first-party script (`GET /v1/event/tag.js`), keeping all tag configuration
// and Conversions API fan-out on the private server side.

import { asks, CONSENT_EVENT, open, policy, read, render, serve } from './consent'
import { keyFor } from './org'
import { capture, touch } from './touch'
import type { Analytics } from './core'
import { automated, internal, mark } from './automated'
import { uuidv7 } from './uid'

export interface BrowserTag {
  platform: string
  type: string
  id: string
  events?: Record<string, string>
}

export interface TagOptions {
  /** The site's publishable key; resolves its project settings on Hanzo Cloud / Analytics. */
  key?: string
  /** The site's host, for a site whose key is the org's. */
  host?: string
  /** First-party Hanzo Cloud / Analytics origin; defaults to https://api.hanzo.ai. */
  base?: string
  /** Domains one visit crosses, passed through to first-party session linking. */
  domains?: string[]
  /**
   * The signed-in person's IAM access token, sent as the bearer on the project
   * settings request so org members are classified as internal traffic.
   */
  token?: () => string | undefined
}

/** Who cloud says the visitor is: a program, the site's own team, or a person. */
export type Audience = 'bot' | 'internal' | 'person'

interface TagRuntime {
  mirror?: (name: string, params: Record<string, unknown>, id: string, to?: string) => void
  reach?: () => string
  ready?: (limit?: number) => Promise<void>
}

interface HostWindow {
  __hanzoTags?: TagRuntime
  __hanzoTagConfig?: {
    key?: string
    host: string
    domains?: string[]
    tags: BrowserTag[]
    audience: Audience
  }
}

const hostWindow = (): HostWindow => window as unknown as HostWindow

let serverTags: BrowserTag[] = []
let audience: Audience = 'person'
let configured = false
let configAnswered = false
let scriptLoaded = false
let applied = ''
let needsReload = false
let reloading = false
let activeBase = 'https://api.hanzo.ai'
let activeKey: string | undefined
let activeHost = ''
let options: TagOptions = {}

const held: Array<() => void> = []
let leaving = false

const bot = (): boolean => audience === 'bot' || automated()
const team = (): boolean => audience === 'internal' || internal()

function due(): boolean {
  return configAnswered && !asks()
}

function flush(): void {
  if (due() || leaving) held.splice(0).forEach((send) => send())
}

/**
 * Resolves once first-party tag & consent configuration has settled (and any
 * server-hosted tag runtime reports ready), or after `limit` ms.
 */
export function ready(limit = 3000): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  const start = Date.now()
  return new Promise((resolve) => {
    const tick = () => {
      if ((configured && configAnswered) || Date.now() - start >= limit) {
        const remote = hostWindow().__hanzoTags?.ready
        if (remote) {
          const remaining = Math.max(0, limit - (Date.now() - start))
          remote(remaining).then(() => resolve(), () => resolve())
          return
        }
        resolve()
        return
      }
      setTimeout(tick, 50)
    }
    tick()
  })
}

function loadServerTagRuntime(): void {
  if (scriptLoaded || !activeKey || typeof document === 'undefined' || !document.head) return
  if (bot() || policy().refused || serverTags.length === 0) return
  const eligible = team() ? serverTags.filter((t) => t.type === 'ga') : serverTags
  if (eligible.length === 0) return

  scriptLoaded = true
  hostWindow().__hanzoTagConfig = {
    key: activeKey,
    host: activeHost,
    domains: options.domains,
    tags: eligible,
    audience: team() ? 'internal' : audience,
  }
  const s = document.createElement('script')
  s.async = true
  s.src = `${activeBase}/v1/event/tag.js`
  if (typeof s.setAttribute === 'function') {
    s.setAttribute('data-key', activeKey)
    s.setAttribute('data-tags-only', '1')
  } else {
    ;(s as unknown as Record<string, string>)['data-key'] = activeKey
    ;(s as unknown as Record<string, string>)['data-tags-only'] = '1'
  }
  document.head.appendChild(s)
}

function apply(): void {
  if (typeof window === 'undefined' || !configured) return
  const c = read()
  const was = applied
  const now = render(c)
  applied = now

  // If a previously granted category was withdrawn after the server tag runtime
  // loaded, reload once (after the consent sheet closes) so no dynamic tag keeps running.
  if (scriptLoaded && was) {
    const prev = new Set(was.split(',').filter(Boolean))
    const next = new Set(now.split(',').filter(Boolean))
    if ([...prev].some((g) => !next.has(g))) needsReload = true
  }
  if (needsReload) {
    if (!open() && !reloading && typeof window.location?.reload === 'function') {
      reloading = true
      setTimeout(() => window.location.reload(), 0)
    }
    return
  }

  capture(c)
  if (configAnswered) loadServerTagRuntime()
  flush()
}

/**
 * Starts first-party consent & server-managed tag resolution. Safe to call on
 * every page load, and a no-op on the server. Returns a cleanup function.
 */
export function start(o: TagOptions = {}): () => void {
  if (typeof window === 'undefined') return () => undefined
  options = o
  addEventListener(CONSENT_EVENT, apply)
  const shown = () => {
    if (document.visibilityState !== 'hidden' && render(read()) !== applied) apply()
  }
  addEventListener('pageshow', shown)
  addEventListener('visibilitychange', shown)
  addEventListener('pagehide', pagehide)

  if (!configured) {
    configured = true
    activeBase = (o.base ?? 'https://api.hanzo.ai').replace(/\/$/, '')
    activeHost = o.host ?? window.location.hostname
    activeKey = o.key ?? keyFor(activeHost)
    const q = new URLSearchParams()
    if (activeKey) q.set('key', activeKey)
    q.set('host', activeHost)

    const answer = (list: BrowserTag[]) => {
      serverTags = list
      configAnswered = true
      apply()
    }

    const url = `${activeBase}/v1/project/tags?${q}`
    const bearer = tokenOf(o)
    const get = (auth?: string) => fetch(url, auth ? { headers: { Authorization: `Bearer ${auth}` } } : undefined)
    const cap = setTimeout(() => answer([]), 3000)

    get(bearer)
      .catch((e: unknown) => (bearer ? get() : Promise.reject(e)))
      .then((r) => (r.ok ? r.json() : { tags: [] }))
      .then((j: { tags?: BrowserTag[]; consent?: unknown; audience?: unknown }) => {
        clearTimeout(cap)
        serve(j.consent)
        if (j.audience === 'bot' || j.audience === 'internal') audience = j.audience
        if (audience === 'internal' && read().analytics) mark()
        answer(Array.isArray(j.tags) ? j.tags : [])
      })
      .catch(() => {
        clearTimeout(cap)
        answer([])
      })
  }

  return () => {
    removeEventListener(CONSENT_EVENT, apply)
    removeEventListener('pageshow', shown)
    removeEventListener('visibilitychange', shown)
    removeEventListener('pagehide', pagehide)
  }
}

function tokenOf(o: TagOptions): string | undefined {
  try {
    return o.token?.() || undefined
  } catch {
    return undefined
  }
}

function pagehide(): void {
  leaving = true
  flush()
}

/** Active tag types reported by the first-party server tag runtime (`''` when none). */
export function reach(): string {
  if (typeof window === 'undefined') return ''
  return hostWindow().__hanzoTags?.reach?.() ?? ''
}

interface Item {
  item_id: string
  item_name?: string
  price?: number
  quantity?: number
}

function unpriced(p: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...p, value: 0 }
  if (Array.isArray(p.items)) out.items = (p.items as Item[]).map((i) => ({ ...i, price: 0 }))
  return out
}

/** Forwards an event to the server-hosted tag runtime if active on the page. */
export function mirror(name: string, params: Record<string, unknown>, id: string, to = reach()): void {
  if (typeof window === 'undefined') return
  const payload = params.test === true ? unpriced(params) : params
  hostWindow().__hanzoTags?.mirror?.(name, payload, id, to)
}

/**
 * Emits a funnel event onto the first-party Hanzo Analytics stream (`POST /v1/event`)
 * under a shared `event_id` (and mirrors to the server-hosted tag runtime if active).
 */
export function track(
  stream: Analytics | undefined,
  name: string,
  params: Record<string, unknown> = {},
  only?: 'tags',
): void {
  if (typeof window === 'undefined') return
  if (!leaving && !due()) {
    held.push(() => track(stream, name, params, only))
    return
  }
  const c = read()
  const event_id = typeof params.event_id === 'string' && params.event_id ? params.event_id : uuidv7()
  const to = reach()
  mirror(name, params, event_id, to)
  if (only === 'tags') return
  stream?.capture(name, {
    ...params,
    ...touch(c),
    event_id,
    consent: render(c),
    tags: to,
    userAgent: navigator.userAgent,
    url: window.location.href,
  })
}

/** Context properties for server-stated events so Hanzo Cloud can attribute them first-party. */
export function visit(): Record<string, unknown> {
  const c = read()
  return { ...touch(c), consent: render(c), tags: reach(), userAgent: navigator.userAgent, url: window.location.href }
}
