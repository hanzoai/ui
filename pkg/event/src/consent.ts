// Cookie consent: what a visitor lets the THIRD PARTIES measure and share. The site's
// own first-party analytics (the stream, core.ts) is essential, never sold or shared,
// and is not governed by it: it runs for every visitor, whatever they chose.
//
// Three categories. Analytics is Google Analytics. Marketing is the Meta pixel
// measuring the ads it was bought for, and every server-side send to an ad platform.
// Ads is Google and Meta using the visit to choose the ads they show elsewhere; off,
// Google's ad_personalization is denied and Meta runs under Limited Data Use.
//
// EVERY VISITOR OPTS IN, wherever they are. A visitor with no stored choice has
// allowed no third party until they accept. Global Privacy Control and Do Not Track
// are a refusal of all three, whatever is stored, and a browser that sends either is
// not asked.
//
// cloud serves the policy with the site's tag config (`GET /v1/project/tags`); what
// a page reads from it is its version, and whether the request carried GPC or DNT.
// A choice is stored beside the version it was made under (`hz_consent_v`); when
// the policy changes, the stored choice no longer counts and the visitor is asked
// again. Until cloud answers, the version in force is the one this client was built
// under (CONSENT_VERSION), so an old choice never counts in the meantime.
//
// Withdrawing a category forgets what its third party kept: Analytics Google
// Analytics' cookies, Marketing the ad click and the platforms' browser ids. The
// first-party id, session, touches and cohort stay: they are the stream's. A browser
// that starts refusing (GPC or DNT) after a grant withdraws it the same way. A sale
// cloud states server-side is sent under the choice the buyer's checkout states,
// never one stored from an earlier page.
//
// The choice is a first-party cookie only this host may write, `__Host-hz_consent`
// (cookie.ts own), for 13 months: the granted categories, comma separated. No
// sibling subdomain can set or shadow it, so another tenant's app or a shared page
// never answers for this site; each host asks for itself. cloud reads the same
// string off each event's `consent` property.
//
// The policy cloud served is kept on the PAGE, under a `Symbol.for` slot, not in
// module scope: `@hanzo/event` and `@hanzo/event/react` are separate bundles that
// each carry a copy of this module, and every copy must read the same version.

import { forget, get, own, setOwn } from './cookie'

export const CONSENT_COOKIE = 'hz_consent'

/** The policy version the stored choice was made under. */
export const CONSENT_VERSION_COOKIE = 'hz_consent_v'

/** The policy version this client was built under: every visitor opts in. */
export const CONSENT_VERSION = 2

/** Fired on `window` when cloud's policy arrives. */
export const POLICY_EVENT = 'hzpolicy'

/** Fired on `window` whenever a choice is stored. */
export const CONSENT_EVENT = 'hzconsent'

export interface Choice {
  analytics: boolean
  marketing: boolean
  ads: boolean
}

/** The one rule: nothing optional before the visitor chooses. */
export type Region = 'opt-in'

/** The policy cloud served for this visitor. */
export interface Policy {
  /** The country cloud placed the visitor in; it changes no rule. Empty when none. */
  region: string
  mode: Region
  /** What is allowed before a choice: nothing. */
  defaults: Choice
  /** The browser sent Global Privacy Control or Do Not Track. */
  refused: boolean
  version: number
}

const NONE: Choice = { analytics: false, marketing: false, ads: false }

const SLOT = Symbol.for('hanzo.event.consent')

type Slot = { served?: Policy }

function slot(): Slot {
  const g = globalThis as unknown as Record<symbol, Slot | undefined>
  return (g[SLOT] ??= {})
}

/** Takes cloud's policy for this visitor and tells the page, so a banner drawn early redraws. */
export function serve(p: unknown): void {
  if (p == null) {
    slot().served = undefined
    return
  }
  const d = p as Partial<Policy>
  if (typeof d.version !== 'number' && typeof d.mode !== 'string') return
  slot().served = {
    region: String(d.region ?? ''),
    mode: 'opt-in',
    defaults: { ...NONE },
    refused: d.refused === true || refused(),
    version: Number(d.version) || 0,
  }
  honour()
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(POLICY_EVENT))
}

/** The policy cloud served, once it has answered. */
export const policy = (): Policy | undefined => slot().served

type Nav = { doNotTrack?: string; msDoNotTrack?: string; globalPrivacyControl?: boolean }

/** Whether the browser sends Global Privacy Control. */
export function gpc(): boolean {
  if (typeof navigator === 'undefined') return false
  return (navigator as unknown as Nav).globalPrivacyControl === true
}

/** Whether the browser sends Global Privacy Control or Do Not Track: a refusal of everything optional. */
export function refused(): boolean {
  if (typeof window === 'undefined') return false
  const n = (typeof navigator === 'undefined' ? {} : navigator) as unknown as Nav
  const dnt = n.doNotTrack ?? (window as unknown as Nav).doNotTrack ?? n.msDoNotTrack
  return gpc() || dnt === '1' || dnt === 'yes'
}

/** Which rule applies to this visitor: opt-in, for every visitor. */
export const region = (): Region => 'opt-in'

/** The policy version in force: cloud's, never older than the one this client was built under. */
const version = (): number => Math.max(slot().served?.version ?? 0, CONSENT_VERSION)

/** Whether the visitor's browser refused, as the page sees it or as cloud saw the request. */
export const declined = (): boolean => refused() || slot().served?.refused === true

/** Whether the visitor has stored a choice under the policy in force. */
export function stored(): boolean {
  return get(own(CONSENT_COOKIE)) !== undefined && get(own(CONSENT_VERSION_COOKIE)) === String(version())
}

/** The grants the cookie holds, under whatever policy they were made. */
function held(): Choice {
  const on = (get(own(CONSENT_COOKIE)) ?? '').split(',')
  return { analytics: on.includes('analytics'), marketing: on.includes('marketing'), ads: on.includes('ads') }
}

/** The visitor's choice: the stored one, else nothing; nothing at all under GPC or DNT. */
export function read(): Choice {
  return declined() || !stored() ? { ...NONE } : held()
}

/** A browser that refuses now, over a grant stored before, withdraws that grant. */
export function honour(): void {
  if (!declined()) return
  const was = held()
  if (was.analytics || was.marketing || was.ads) save({ ...NONE })
}

/** Whether the consent banner must be shown: a visitor who has not chosen and whose browser has not refused. */
export function asks(): boolean {
  return typeof document !== 'undefined' && !declined() && !stored()
}

/** The choice as the `consent` property and the cookie spell it. */
export function render(c: Choice): string {
  return (['analytics', 'marketing', 'ads'] as const).filter((k) => c[k]).join(',')
}

/**
 * Stores a choice and tells the page. A category just allowed loads its
 * libraries with no reload, and Google's consent state is updated; a choice that
 * withdraws what a running library was loaded under reloads the page (tags.ts),
 * since a library that has run cannot be unloaded. A browser that refused stores
 * a refusal, whatever was chosen.
 */
export function save(c: Choice): void {
  const out: Choice = declined() ? { ...NONE } : { analytics: c.analytics, marketing: c.marketing, ads: c.ads }
  setOwn(CONSENT_COOKIE, render(out), 395)
  setOwn(CONSENT_VERSION_COOKIE, String(version()), 395)
  if (!out.analytics) withdraw(ANALYTICS)
  if (!out.marketing) withdraw(MARKETING)
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

const MARKETING: Kept = {
  cookies: [
    'hz_touch', '_fbp', '_fbc', '_ttp', '_tt_enable_cookie', 'ttcsid', '_twclid', 'li_fat_id', 'li_giant',
    '_uetsid', '_uetvid', '_pin_unauth', '_epik', '_derived_epik', '_rdt_uuid', '_rdt_cid',
  ],
  patterns: [/^_gcl_[a-z]+$/, /^_gac_[\w-]+$/, /^ttcsid_[A-Z0-9]+$/],
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
export const acceptAll = (): void => save({ analytics: true, marketing: true, ads: true })

/** Refuse every optional category. */
export const rejectAll = (): void => save({ ...NONE })
