// Cookie consent: what a visitor lets the THIRD PARTIES measure and share. The site's
// own first-party analytics (the stream, core.ts) is essential, never sold or shared,
// and is not governed by it: it runs for every visitor, whatever they chose.
//
// Three categories. Analytics is Google Analytics' cookies. Marketing is the Meta pixel
// and every other ad platform's pixel. Ads is Google and Meta using the visit for ad
// personalization: off, Google's ad_storage, ad_user_data and ad_personalization are
// denied and Meta runs under Limited Data Use. That is the sale-or-sharing opt-out.
//
// THE RULE IS THE VISITOR'S REGION, decided by cloud per request from the edge's
// country and US state and served with the site's tag config (`GET /v1/project/tags`):
//
//   eu          the EU, the EEA, the UK and Switzerland, and any visitor cloud cannot
//               place. Before a choice Google Analytics runs, under Consent Mode with
//               every flag denied (cookieless pings, no cookie); Meta's pixels are init'ed
//               held revoked and send nothing; no other platform loads; the banner asks.
//   us_privacy  a US state with a privacy law (or a US visitor with no attested state):
//               everything on by default, no banner, and a persistent "Your Privacy
//               Choices" link to the sheet, where turning Ads off is the opt-out.
//   global      everywhere else: everything on by default, and a notice the visitor
//               closes (notice / noticed); any category saved off is an opt-out.
//
// Global Privacy Control or Do Not Track is `refused`, everywhere: it refuses all three,
// locks the switches off, and no third party loads in any region, Google Analytics
// included. Until cloud answers, the rule is the one it last served this tab
// (sessionStorage), else eu.
//
// A choice is stored beside the version it was made under (`hz_consent_v`) and the
// rule it was made under (`hz_consent_rule`). eu counts only a choice made under eu
// (or under policy version 2, when every visitor opted in): an opt-out made where
// everything was on is no eu yes. The policy's floor gates GRANTS, never opt-outs: a
// choice made under a version below it keeps what it refused, and only what it allowed
// is void — in eu the visitor is asked again, elsewhere the default stands for it. A
// choice that allowed nothing is never asked again.
//
// Withdrawing a category forgets what its third party kept: Analytics Google
// Analytics' cookies, Marketing the ad click and the platforms' browser ids, Ads
// Google's ad cookies. The first-party id, session, touches and cohort stay: they are
// the stream's. A sale cloud states server-side is sent under the choice the buyer's
// checkout states, never one stored from an earlier page.
//
// The choice is a first-party cookie only this host may write, `__Host-hz_consent`
// (cookie.ts own), for 13 months: the granted categories, comma separated. No
// sibling subdomain can set or shadow it, so another tenant's app or a shared page
// never answers for this site; each host asks for itself. cloud reads the same
// string off each event's `consent` property. A closed notice is `hz_consent_notice`
// beside it, and is no choice: it grants nothing in eu.
//
// The policy cloud served is kept on the PAGE, under a `Symbol.for` slot, not in
// module scope: `@hanzo/event` and `@hanzo/event/react` are separate bundles that
// each carry a copy of this module, and every copy must read the same policy.

import { forget, get, own, setOwn } from './cookie'

export const CONSENT_COOKIE = 'hz_consent'

/** The policy version the stored choice was made under. */
export const CONSENT_VERSION_COOKIE = 'hz_consent_v'

/** The rule the stored choice was made under. */
export const RULE_COOKIE = 'hz_consent_rule'

/** The global notice, closed. */
export const NOTICE_COOKIE = 'hz_consent_notice'

/** The policy version this client was built under. */
export const CONSENT_VERSION = 3

/** The oldest policy version whose stored choices this client counts. */
export const CONSENT_FLOOR = 2

/** Fired on `window` when cloud's policy arrives. */
export const POLICY_EVENT = 'hzpolicy'

/** Fired on `window` whenever a choice is stored or the notice closed. */
export const CONSENT_EVENT = 'hzconsent'

export interface Choice {
  analytics: boolean
  marketing: boolean
  ads: boolean
}

/** The rule a visitor is under, by where cloud placed them. */
export type Mode = 'eu' | 'us_privacy' | 'global'

/** The policy for this visitor. */
export interface Policy {
  mode: Mode
  /** The browser sent Global Privacy Control or Do Not Track, as cloud saw the request or the page sees it. */
  refused: boolean
  version: number
  /** Where cloud placed the visitor: a country, `US-CA` with an attested state, empty when none. */
  region: string
}

const NONE: Choice = { analytics: false, marketing: false, ads: false }
const ALL: Choice = { analytics: true, marketing: true, ads: true }
const MODES: readonly Mode[] = ['eu', 'us_privacy', 'global']
const CACHE = 'hz_consent_policy'

const SLOT = Symbol.for('hanzo.event.consent')

type Served = Policy & { floor: number }
type Slot = { served?: Served; sheet?: boolean }

function slot(): Slot {
  const g = globalThis as unknown as Record<symbol, Slot | undefined>
  return (g[SLOT] ??= {})
}

/** Reads cloud's answer; anything it cannot read as a policy is none. */
function parse(p: unknown): Served | undefined {
  if (p == null || typeof p !== 'object') return undefined
  const d = p as Partial<Served>
  if (typeof d.version !== 'number' && typeof d.mode !== 'string') return undefined
  return {
    mode: MODES.includes(d.mode as Mode) ? (d.mode as Mode) : 'eu',
    refused: d.refused === true,
    version: Number(d.version) || 0,
    region: String(d.region ?? ''),
    floor: Number(d.floor) || CONSENT_FLOOR,
  }
}

function session(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.sessionStorage
  } catch {
    return undefined
  }
}

/** Takes cloud's policy for this visitor, keeps it for the tab, and tells the page, so a banner drawn early redraws. */
export function serve(p: unknown): void {
  const s = parse(p)
  slot().served = s
  try {
    if (s) session()?.setItem(CACHE, JSON.stringify(s))
  } catch {
    /* a full or blocked store: the policy lives on this page alone */
  }
  if (!s) return
  honour()
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(POLICY_EVENT))
}

/** The policy in force: cloud's answer, else the one it last served this tab, else eu. Synchronous. */
function served(): Served {
  const s = slot().served
  if (s) return s
  try {
    const c = parse(JSON.parse(session()?.getItem(CACHE) ?? 'null'))
    if (c) return c
  } catch {
    /* an unreadable cache is none */
  }
  return { mode: 'eu', refused: false, version: CONSENT_VERSION, region: '', floor: CONSENT_FLOOR }
}

/** The policy for this visitor, at once: cloud's, the tab's last, or eu until either. */
export function policy(): Policy {
  const s = served()
  return { mode: s.mode, refused: s.refused || refused(), version: version(), region: s.region }
}

type Nav = { doNotTrack?: string; msDoNotTrack?: string; globalPrivacyControl?: boolean }

/** Whether the browser sends Global Privacy Control. */
export function gpc(): boolean {
  if (typeof navigator === 'undefined') return false
  return (navigator as unknown as Nav).globalPrivacyControl === true
}

/** Whether the browser sends Global Privacy Control or Do Not Track. */
export function refused(): boolean {
  if (typeof window === 'undefined') return false
  const n = (typeof navigator === 'undefined' ? {} : navigator) as unknown as Nav
  const dnt = n.doNotTrack ?? (window as unknown as Nav).doNotTrack ?? n.msDoNotTrack
  return gpc() || dnt === '1' || dnt === 'yes'
}

/** The policy version in force: cloud's, never older than the one this client was built under. */
const version = (): number => Math.max(slot().served?.version ?? 0, CONSENT_VERSION)

/** Whether the visitor's browser refused, as the page sees it or as cloud saw the request. */
export const declined = (): boolean => policy().refused

/** The stored choice that counts under the rule in force, and whether its version is current. */
function kept(): { held: Choice; current: boolean } | undefined {
  const c = get(own(CONSENT_COOKIE))
  if (c === undefined) return undefined
  const v = Number(get(own(CONSENT_VERSION_COOKIE)))
  const rule = get(own(RULE_COOKIE))
  if (policy().mode === 'eu' && !(rule === 'eu' || (rule === undefined && v === 2))) return undefined
  const on = c.split(',')
  return {
    held: { analytics: on.includes('analytics'), marketing: on.includes('marketing'), ads: on.includes('ads') },
    current: v >= served().floor && v <= version(),
  }
}

const any = (c: Choice): boolean => c.analytics || c.marketing || c.ads

/** Whether the visitor has stored a choice that stops the asking: a current one, or one that allowed nothing. */
export function stored(): boolean {
  const k = kept()
  return k !== undefined && (k.current || !any(k.held))
}

/** The visitor's choice: nothing at all under GPC or DNT; else the stored one, its grants void when made under a version below the floor; else the region's default (nothing in eu, everything elsewhere). */
export function read(): Choice {
  const p = policy()
  if (p.refused) return { ...NONE }
  const base = p.mode === 'eu' ? NONE : ALL
  const k = kept()
  if (!k) return { ...base }
  if (k.current) return { ...k.held }
  return { analytics: base.analytics && k.held.analytics, marketing: base.marketing && k.held.marketing, ads: base.ads && k.held.ads }
}

/** A browser that refuses now, over a grant stored before, withdraws that grant. */
export function honour(): void {
  const k = kept()
  if (declined() && k && any(k.held)) save({ ...NONE })
}

/** Whether the consent banner must ask: eu, no choice that stops the asking, and a browser that has not refused. */
export function asks(): boolean {
  if (typeof document === 'undefined') return false
  const p = policy()
  return p.mode === 'eu' && !p.refused && !stored()
}

/**
 * Says the consent sheet is open or closed. While it is open a withdrawal that needs
 * the page reloaded waits (tags.ts); closing it reloads the page once if one does.
 */
export function sheet(open: boolean): void {
  slot().sheet = open
  if (!open && typeof window !== 'undefined') window.dispatchEvent(new Event(CONSENT_EVENT))
}

/** Whether the consent sheet is open. */
export const open = (): boolean => slot().sheet === true

/** Records that the visitor closed the global notice. It grants nothing. */
export function notice(): void {
  setOwn(NOTICE_COOKIE, '1', 395)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CONSENT_EVENT))
}

/** Whether the visitor closed the global notice. */
export const noticed = (): boolean => get(own(NOTICE_COOKIE)) === '1'

/** The choice as the `consent` property and the cookie spell it. */
export function render(c: Choice): string {
  return (['analytics', 'marketing', 'ads'] as const).filter((k) => c[k]).join(',')
}

/**
 * Stores a choice beside the version and the rule in force, and tells the page. A
 * category just allowed loads its libraries with no reload, Google's consent state and
 * Meta's consent and Limited Data Use are updated at once, and a choice that withdraws
 * a library that cannot be told reloads the page (tags.ts). A browser that refused
 * stores a refusal.
 */
export function save(c: Choice): void {
  const p = policy()
  const out: Choice = p.refused ? { ...NONE } : { analytics: c.analytics, marketing: c.marketing, ads: c.ads }
  setOwn(CONSENT_COOKIE, render(out), 395)
  setOwn(CONSENT_VERSION_COOKIE, String(version()), 395)
  setOwn(RULE_COOKIE, p.mode, 395)
  if (!out.analytics) withdraw(ANALYTICS)
  if (!out.marketing) withdraw(MARKETING)
  if (!out.ads) withdraw(ADS)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CONSENT_EVENT))
}

/**
 * What a category keeps on the device: cookies by exact name, the numbered forms a
 * platform writes (`_ga_<container>`, `_gat_<tracker>`, `ttcsid_<pixel>`), and storage
 * keys. A name merely spelled alike — `_gateway_session`, `_uetoken`, `ttcsid_app` — is
 * the site's own and is never matched.
 */
type Kept = { cookies: readonly string[]; patterns: readonly RegExp[]; storage: readonly string[] }

// Google Analytics' cookies, and `hz_cid`, the client id kept for forwarding to it.
const ANALYTICS: Kept = {
  cookies: ['_ga', '_gid', '_gat', 'hz_cid'],
  patterns: [/^_ga_[A-Z0-9]+$/, /^_gat_[\w-]+$/],
  storage: [],
}

// The ad platforms' browser ids and the ad click kept for forwarding to them.
const MARKETING: Kept = {
  cookies: [
    'hz_touch', '_fbp', '_fbc', '_ttp', '_tt_enable_cookie', 'ttcsid', '_twclid', 'li_fat_id', 'li_giant',
    '_uetsid', '_uetvid', '_pin_unauth', '_epik', '_derived_epik', '_rdt_uuid', '_rdt_cid',
  ],
  patterns: [/^ttcsid_[A-Z0-9]+$/],
  storage: [],
}

// Google's ad cookies, which ad_storage governs.
const ADS: Kept = {
  cookies: [],
  patterns: [/^_gcl_[a-z]+$/, /^_gac_[\w-]+$/],
  storage: [],
}

/** Forgets what a withdrawn category kept. */
function withdraw(k: Kept): void {
  forget(k.cookies, k.patterns)
  if (typeof window === 'undefined') return
  try {
    for (const key of k.storage) window.localStorage?.removeItem(key)
  } catch {
    /* storage refused: nothing was kept there */
  }
}

/** Accept every category. */
export const acceptAll = (): void => save({ ...ALL })

/** Refuse every optional category. */
export const rejectAll = (): void => save({ ...NONE })
