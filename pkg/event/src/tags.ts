// The tag manager: loads each ad and analytics platform's browser pixel, after
// consent, from the site's tag configuration, and fires every event to each one
// under one event_id.
//
// WHERE THE IDS COME FROM. Never from a site's code. The site's tag set is
// cloud's `GET /v1/project/tags` (non-secret ids only), so connecting a
// platform to a site is a configuration change and every surface gets it:
//
//   { tags: [{ platform: 'ga4', type: 'ga', id: 'G-…' },
//            { platform: 'linkedin', type: 'linkedin', id: '1234',
//              events: { order_completed: '9876' } }, …] }
//
// `events` maps one of OUR event names to the platform's own conversion id for
// it: a Google Ads `AW-…/label`, a LinkedIn conversion rule, an X event id.
// Google Ads, LinkedIn and X name conversions by rule, not by event, and an
// event with no rule there is not sent to that platform.
//
// WHAT LOADS WHEN. Nothing loads before consent. Analytics allows GA4;
// Marketing allows Google Ads, Meta, LinkedIn, X and TikTok. A visitor who has
// not chosen has allowed what their region presumes (consent.ts), so an EU
// visitor's page makes no request to any platform until they accept. Google's
// Consent Mode v2 is set denied before gtag.js is fetched and updated on every
// choice. A choice that allows more loads the rest with no reload.
//
// ONE EVENT ID. `track` mints it, fires the browser pixels with it, and records
// it on our stream with the list of pixels that fired (`tags`). Cloud forwards
// the same moment server-side under the same id, and each platform keeps one
// (Meta and TikTok by event_id, GA4 by transaction_id on a purchase); it sends
// GA4 only what the page's own gtag did not, which is what `tags` says.
//
// WHAT EACH PLATFORM CALLS AN EVENT is the one table in @hanzo/events; cloud
// reads the same table.

import { namesOn } from '@hanzo/events'
import { CONSENT_EVENT, read, render, type Choice } from './consent'
import { capture, touch } from './touch'
import type { Analytics } from './core'

export interface BrowserTag {
  platform: string
  type: string
  id: string
  events?: Record<string, string>
}

export interface TagOptions {
  /** The site's publishable key; resolves its tag set. */
  key?: string
  /** The site's host, for a site whose key is the org's. */
  host?: string
  /** cloud's origin; defaults to https://api.hanzo.ai. */
  base?: string
  /** Domains one visit crosses, so GA4 keeps it one session. */
  domains?: string[]
}

/**
 * The publishable key of each site's project, which is how cloud finds the site's
 * tag set. A `pk-` is public by design (it ships in every page); it names a site,
 * never a platform id. A host absent here has no tag config unless `start` is
 * given a key.
 */
export const SITE_KEY: Readonly<Record<string, string>> = Object.freeze({
  'hanzo.ai': 'pk-CmfLA2K6kvsPflrS9DSkt06H_kSoQB_21sjedt6VJdc',
  'www.hanzo.ai': 'pk-CmfLA2K6kvsPflrS9DSkt06H_kSoQB_21sjedt6VJdc',
  'hanzo.app': 'pk-wlnXN2a9_vmCm60yTFtQ629Q8TyuaxBNZbY1RWT72gQ',
  'hanzo.team': 'pk-NCzD2FiHpZv8KUpkCX4olT1LJOJsMxBC_Z8NkiQsOFQ',
  'pay.hanzo.ai': 'pk-eX6kv7JZNoiYn1WkeJH3tT_8OvkVYScmCXnLMwxTKf8',
  'platform.hanzo.ai': 'pk-My1RpZLEUnTj8vAdPbWKYdDUuhxZJ4dVjHcwjZN4rZ8',
  'docs.hanzo.ai': 'pk-jukhtjMT2ymoeBDAeFjINQWlBv-v9sNn1TPztiCrrwk',
  'hanzo.bot': 'pk-W5d7Mn7ZukT7igyscIy6Pqe8JpA0Ge604Yn4xNR4JCU',
  'cloud.hanzo.ai': 'pk-RAfEGHPoNdCEU9fnA_cPd_Xo9Tci44rlYQV9xuJ1Ob0',
})

type Call = (...args: unknown[]) => void
type Page = {
  dataLayer?: unknown[]
  gtag?: Call
  fbq?: Call & { queue?: unknown[]; callMethod?: Call; push?: unknown; loaded?: boolean; version?: string }
  _fbq?: unknown
  lintrk?: Call & { q?: unknown[] }
  _linkedin_data_partner_ids?: string[]
  twq?: Call & { queue?: unknown[]; exe?: Call; version?: string }
  ttq?: Record<string, Call> & { _i?: Record<string, unknown>; _t?: Record<string, number>; _o?: Record<string, unknown>; methods?: string[]; load?: Call; page?: Call; track?: Call }
  TiktokAnalyticsObject?: string
}

const page = (): Page => window as unknown as Page

let tags: BrowserTag[] = []
let configured = false
let options: TagOptions = {}
const loaded = new Set<string>()

/** gtag.js: 'idle' until fetched, 'wait' while on its way, then how it answered. */
let google: 'idle' | 'wait' | 'loaded' | 'failed' = 'idle'
let configAnswered = false

const held: Array<() => void> = []
let leaving = false

function settled(): boolean {
  return configAnswered && google !== 'wait'
}

function flush(): void {
  if (settled() || leaving) held.splice(0).forEach((send) => send())
}

function script(src: string, onload?: () => void, onerror?: () => void): void {
  const s = document.createElement('script')
  s.async = true
  s.src = src
  if (onload) s.onload = onload
  if (onerror) s.onerror = onerror
  document.head.appendChild(s)
}

// ── Google ──────────────────────────────────────────────────────────────

function gtagStub(): Call {
  const p = page()
  p.dataLayer = p.dataLayer || []
  if (!p.gtag) {
    // gtag.js reads the `arguments` object itself, so this is a function and not an arrow.
    p.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      p.dataLayer!.push(arguments)
    }
  }
  return p.gtag
}

const g = (on: boolean) => (on ? 'granted' : 'denied')

/** Google Consent Mode v2: denied until said otherwise, then the visitor's choice. */
function consentMode(c: Choice, first: boolean): void {
  const gtag = gtagStub()
  const state = {
    analytics_storage: g(c.analytics),
    ad_storage: g(c.marketing),
    ad_user_data: g(c.marketing),
    ad_personalization: g(c.marketing && c.ads),
  }
  if (first) {
    gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      wait_for_update: 500,
    })
  }
  gtag('consent', 'update', state)
}

function loadGoogle(ids: string[]): void {
  const gtag = gtagStub()
  const fresh = ids.filter((id) => !loaded.has(id))
  if (!fresh.length) return
  if (google === 'idle') {
    google = 'wait'
    gtag('js', new Date())
    const done = (to: 'loaded' | 'failed') => () => {
      if (google !== 'wait') return
      google = to
      flush()
    }
    script(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(fresh[0])}`, done('loaded'), done('failed'))
    // gtag.js answers once: loaded, failed (a blocker), or silent past 8 s.
    setTimeout(done('failed'), 8000)
  }
  for (const id of fresh) {
    loaded.add(id)
    gtag('config', id, options.domains ? { linker: { domains: options.domains } } : {})
  }
}

// ── The other pixels ────────────────────────────────────────────────────

function loadMeta(id: string, c: Choice): void {
  const p = page()
  if (!p.fbq) {
    const n = (p.fbq = function (...a: unknown[]) {
      if (n.callMethod) n.callMethod(...a)
      else n.queue!.push(a)
    } as NonNullable<Page['fbq']>)
    if (!p._fbq) p._fbq = n
    n.push = n
    n.loaded = true
    n.version = '2.0'
    n.queue = []
    script('https://connect.facebook.net/en_US/fbevents.js')
  }
  if (!c.ads) p.fbq('dataProcessingOptions', ['LDU'], 0, 0)
  p.fbq('init', id)
  p.fbq('track', 'PageView')
}

function loadLinkedIn(id: string): void {
  const p = page()
  p._linkedin_data_partner_ids = p._linkedin_data_partner_ids || []
  p._linkedin_data_partner_ids.push(id)
  if (!p.lintrk) {
    const l = (p.lintrk = function (...a: unknown[]) {
      l.q!.push(a)
    } as NonNullable<Page['lintrk']>)
    l.q = []
  }
  script('https://snap.licdn.com/li.lms-analytics/insight.min.js')
}

function loadX(id: string): void {
  const p = page()
  if (!p.twq) {
    const s = (p.twq = function (...a: unknown[]) {
      if (s.exe) s.exe(...a)
      else s.queue!.push(a)
    } as NonNullable<Page['twq']>)
    s.version = '1.1'
    s.queue = []
    script('https://static.ads-twitter.com/uwt.js')
  }
  p.twq('config', id)
}

const TIKTOK_METHODS = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie']

function loadTikTok(id: string): void {
  const p = page()
  p.TiktokAnalyticsObject = 'ttq'
  const q = (p.ttq = p.ttq || ([] as unknown as NonNullable<Page['ttq']>)) as unknown as Record<string, unknown> & unknown[]
  if (!q._i) {
    q.methods = TIKTOK_METHODS
    for (const m of TIKTOK_METHODS) q[m] = (...a: unknown[]) => q.push([m, ...a])
    q._i = {}
    q._t = {}
    q._o = {}
    q.load = (sdk: string) => {
      ;(q._i as Record<string, unknown>)[sdk] = []
      ;(q._t as Record<string, number>)[sdk] = Date.now()
      script(`https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${encodeURIComponent(sdk)}&lib=ttq`)
    }
  }
  ;(q.load as Call)(id)
  ;(q.page as Call)()
}

// ── Which tag is allowed and running ────────────────────────────────────

const NEEDS: Record<string, keyof Choice> = {
  ga: 'analytics',
  gads: 'marketing',
  meta: 'marketing',
  linkedin: 'marketing',
  x: 'marketing',
  tiktok: 'marketing',
}

/** GA4 also counts a visit when only Marketing is allowed (Consent Mode keeps it cookieless). */
const allowed = (t: BrowserTag, c: Choice): boolean =>
  t.type === 'ga' ? c.analytics || c.marketing : Boolean(NEEDS[t.type] && c[NEEDS[t.type]])

function apply(): void {
  if (typeof window === 'undefined' || !configured) return
  const c = read()
  capture(c)
  const on = tags.filter((t) => allowed(t, c))
  const ids = on.filter((t) => t.type === 'ga' || t.type === 'gads').map((t) => t.id)
  if (ids.length) {
    consentMode(c, !loaded.has('consent'))
    loaded.add('consent')
    loadGoogle(ids)
  }
  for (const t of on) {
    const k = `${t.type}:${t.id}`
    if (loaded.has(k)) continue
    if (t.type === 'meta') loadMeta(t.id, c)
    else if (t.type === 'linkedin') loadLinkedIn(t.id)
    else if (t.type === 'x') loadX(t.id)
    else if (t.type === 'tiktok') loadTikTok(t.id)
    else continue
    loaded.add(k)
  }
  flush()
}

/**
 * Starts the tag manager: fetches the site's tag set and loads what consent
 * allows, again on every consent change. Safe to call on every page load, and
 * a no-op on the server. Returns a function that stops listening.
 */
export function start(o: TagOptions = {}): () => void {
  if (typeof window === 'undefined') return () => undefined
  options = o
  addEventListener(CONSENT_EVENT, apply)
  addEventListener('pagehide', pagehide)
  if (!configured) {
    configured = true
    const base = (o.base ?? 'https://api.hanzo.ai').replace(/\/$/, '')
    const q = new URLSearchParams()
    const host = o.host ?? window.location.hostname
    const key = o.key ?? SITE_KEY[host]
    if (key) q.set('key', key)
    q.set('host', host)
    const answer = (list: BrowserTag[]) => {
      tags = list
      configAnswered = true
      apply()
    }
    // A page never waits on its tag config: an unreachable cloud is an empty set.
    const cap = setTimeout(() => answer([]), 3000)
    fetch(`${base}/v1/project/tags?${q}`)
      .then((r) => (r.ok ? r.json() : { tags: [] }))
      .then((j: { tags?: BrowserTag[] }) => {
        clearTimeout(cap)
        answer(Array.isArray(j.tags) ? j.tags : [])
      })
      .catch(() => {
        clearTimeout(cap)
        answer([])
      })
  }
  return () => {
    removeEventListener(CONSENT_EVENT, apply)
    removeEventListener('pagehide', pagehide)
  }
}

function pagehide(): void {
  leaving = true
  flush()
}

/** The browser tags a moment can reach right now, as the `tags` property spells it. */
export function reach(): string {
  const c = read()
  const to: string[] = []
  for (const t of tags) {
    if (!allowed(t, c)) continue
    const running =
      t.type === 'ga'
        ? google === 'loaded' && c.analytics
        : t.type === 'gads'
          ? google === 'loaded' && c.marketing
          : loaded.has(`${t.type}:${t.id}`)
    if (running && !to.includes(t.type)) to.push(t.type)
  }
  return to.join(',')
}

// ── Firing an event ─────────────────────────────────────────────────────

interface Item {
  item_id: string
  item_name?: string
  item_category?: string
  item_variant?: string
  price?: number
  quantity?: number
}

const META_STANDARD = new Set([
  'AddPaymentInfo', 'AddToCart', 'AddToWishlist', 'CompleteRegistration', 'Contact', 'CustomizeProduct',
  'Donate', 'FindLocation', 'InitiateCheckout', 'Lead', 'Purchase', 'Schedule', 'Search', 'StartTrial',
  'SubmitApplication', 'Subscribe', 'ViewContent',
])

function shape(platform: 'meta' | 'tiktok' | 'x', p: Record<string, unknown>): Record<string, unknown> {
  const items = Array.isArray(p.items) ? (p.items as Item[]) : []
  const out: Record<string, unknown> = {}
  if (typeof p.value === 'number') out.value = p.value
  out.currency = typeof p.currency === 'string' ? p.currency : 'USD'
  if (!items.length) return out
  if (platform === 'meta') {
    out.content_type = 'product'
    out.content_ids = items.map((i) => i.item_id)
    out.contents = items.map((i) => ({ id: i.item_id, quantity: i.quantity ?? 1, item_price: i.price }))
    out.content_name = items[0].item_name
    out.num_items = items.reduce((n, i) => n + (i.quantity ?? 1), 0)
  } else if (platform === 'tiktok') {
    out.content_type = 'product'
    out.contents = items.map((i) => ({ content_id: i.item_id, content_name: i.item_name, quantity: i.quantity ?? 1, price: i.price }))
  } else {
    out.contents = items.map((i) => ({ content_id: i.item_id, content_name: i.item_name, content_price: i.price, num_items: i.quantity ?? 1 }))
  }
  return out
}

/** A test order states no amount: nothing sent for it can be summed into revenue. */
function unpriced(p: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...p, value: 0 }
  if (Array.isArray(p.items)) out.items = (p.items as Item[]).map((i) => ({ ...i, price: 0 }))
  return out
}

/**
 * Sends one moment to the browser tags named in `to`, under `id`. The names each
 * platform knows it by are the table in @hanzo/events; a platform the table
 * gives no name, or a rule-named platform with no rule for it, is not sent it.
 */
export function mirror(name: string, params: Record<string, unknown>, id: string, to = reach()): void {
  const p = page()
  const on = new Set(to.split(',').filter(Boolean))
  const ga4 = namesOn(name, 'ga4')
  const test = params.test === true
  if (test) params = unpriced(params)
  const transaction = typeof params.order_id === 'string' ? { transaction_id: params.order_id } : {}
  for (const t of tags) {
    if (!on.has(t.type)) continue
    const rule = t.events?.[name]
    if (t.type === 'ga') {
      for (const n of ga4) {
        p.gtag?.('event', n, { ...params, ...transaction, event_id: id, transport_type: 'beacon', ...(test ? { debug_mode: true } : {}) })
      }
    } else if (t.type === 'gads' && rule) {
      p.gtag?.('event', 'conversion', {
        send_to: rule,
        value: typeof params.value === 'number' ? params.value : undefined,
        currency: typeof params.currency === 'string' ? params.currency : 'USD',
        ...transaction,
      })
    } else if (t.type === 'meta') {
      for (const n of namesOn(name, 'meta')) {
        p.fbq?.(META_STANDARD.has(n) ? 'track' : 'trackCustom', n, shape('meta', params), { eventID: id })
      }
    } else if (t.type === 'tiktok') {
      for (const n of namesOn(name, 'tiktok')) p.ttq?.track?.(n, shape('tiktok', params), { event_id: id })
    } else if (t.type === 'linkedin' && rule && namesOn(name, 'linkedin').length) {
      p.lintrk?.('track', { conversion_id: Number(rule) })
    } else if (t.type === 'x' && rule && namesOn(name, 'x').length) {
      p.twq?.('event', rule, { ...shape('x', params), conversion_id: id })
    }
  }
}

/**
 * One moment, to every place it is counted, under one event_id: our stream
 * always hears it (with the consent, the click and the browser ids cloud
 * forwards on), and each browser tag that is running hears it too. A moment
 * that arrives while gtag.js is still on its way waits for it, so GA4 sees it
 * with a session; a page that is leaving sends what it holds as things stand.
 *
 * A paid order is stated by the SERVER on our stream (and forwarded server-side);
 * its browser copy is `track(stream, 'order_completed', {event_id: order, order_id:
 * order, …}, 'tags')`: the same id, the pixels only, so nothing counts twice.
 */
export function track(
  stream: Analytics | undefined,
  name: string,
  params: Record<string, unknown> = {},
  /** `'tags'` fires the browser pixels only: the server states this moment on our stream itself. */
  only?: 'tags',
): void {
  if (typeof window === 'undefined') return
  if (!leaving && !settled()) {
    held.push(() => track(stream, name, params, only))
    return
  }
  const c = read()
  // A moment the server also states (a paid order) brings its own id, the order's,
  // so each platform sees the browser's copy and the server's as one.
  const event_id = typeof params.event_id === 'string' && params.event_id ? params.event_id : crypto.randomUUID()
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

/** What cloud needs to forward a moment a page states itself, as if the browser had sent it. */
export function visit(): Record<string, unknown> {
  const c = read()
  return { ...touch(c), consent: render(c), tags: reach(), userAgent: navigator.userAgent, url: window.location.href }
}
