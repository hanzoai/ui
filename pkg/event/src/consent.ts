// Cookie consent: what a visitor lets a site measure and share, and the rule for
// what a visitor who has not chosen is presumed to allow.
//
// Three categories. Analytics is our own stream and GA4. Marketing is the ad
// platforms measuring the conversions they bought (Google Ads, Meta, LinkedIn,
// X, TikTok) and every server-side send. Ads is those platforms using the visit
// for audiences; off, Google's ad_personalization is denied and Meta runs under
// Limited Data Use.
//
// THE DEFAULT depends on where the visitor is. In the EU, UK and Switzerland,
// and anywhere else that is not a US state, nothing is allowed until they say
// so: a visitor with no stored choice has allowed nothing. In the US the default
// is on and the choice is an opt-out ("Do not sell or share my personal
// information"). Global Privacy Control, and Do Not Track, turn marketing and
// ads off in every region whatever is stored: California reads GPC as the opt-out
// of sale and sharing.
//
// The region comes from cloud. The site's tag config (`GET /v1/project/tags`) answers
// with the rule that binds this visitor, resolved at the edge from where the request
// came from (`serve`). Until it answers, and if it never does, the zone is the browser's
// own time zone and a zone that is not a US zone is treated as opt-in: wrong in the
// safe direction, a US visitor on a foreign clock is asked and a European is never
// presumed to have agreed.
//
// The policy has a version. A choice is stored beside the version it was made under
// (`hz_consent_v`); when the policy changes, the stored choice no longer counts and the
// visitor is asked again.
//
// The choice is a first-party cookie, `hz_consent`, on the registrable domain
// for 13 months: the granted categories, comma separated. cloud reads the same
// string off each event's `consent` property.

import { get, set } from './cookie'

export const CONSENT_COOKIE = 'hz_consent'

/** The policy version the stored choice was made under. */
export const CONSENT_VERSION_COOKIE = 'hz_consent_v'

/** Fired on `window` when cloud's rule for this visitor arrives. */
export const POLICY_EVENT = 'hzpolicy'

/** Fired on `window` whenever a choice is stored. */
export const CONSENT_EVENT = 'hzconsent'

export interface Choice {
  analytics: boolean
  marketing: boolean
  ads: boolean
}

export type Region = 'opt-in' | 'opt-out'

/** The rule cloud resolved for this visitor. */
export interface Policy {
  region: string
  mode: Region
  defaults: Choice
  gpc: boolean
  version: number
  notice?: string
}

let served: Policy | undefined

/** Takes cloud's rule for this visitor and tells the page, so a banner drawn early redraws. */
export function serve(p: unknown): void {
  if (p == null) {
    served = undefined
    return
  }
  const d = p as Partial<Policy>
  if ( (d.mode !== 'opt-in' && d.mode !== 'opt-out') || !d.defaults) return
  served = {
    region: String(d.region ?? ''),
    mode: d.mode,
    defaults: { analytics: !!d.defaults.analytics, marketing: !!d.defaults.marketing, ads: !!d.defaults.ads },
    gpc: d.gpc === true,
    version: Number(d.version) || 0,
    notice: typeof d.notice === 'string' ? d.notice : undefined,
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(POLICY_EVENT))
}

/** The rule cloud resolved, once it has answered. */
export const policy = (): Policy | undefined => served

type Nav = { doNotTrack?: string; msDoNotTrack?: string; globalPrivacyControl?: boolean }

const US =
  /^(America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Adak|Boise|Detroit|Juneau|Sitka|Nome|Yakutat|Menominee|Metlakatla|Indiana\/.*|Kentucky\/.*|North_Dakota\/.*)|Pacific\/Honolulu|US\/.*)$/

/** Whether the browser sends Global Privacy Control. */
export function gpc(): boolean {
  if (typeof navigator === 'undefined') return false
  return (navigator as unknown as Nav).globalPrivacyControl === true
}

/** Whether the browser sends Global Privacy Control or Do Not Track. */
export function refused(): boolean {
  if (typeof window === 'undefined') return false
  const n = navigator as unknown as Nav
  const dnt = n.doNotTrack ?? (window as unknown as Nav).doNotTrack ?? n.msDoNotTrack
  return gpc() || dnt === '1' || dnt === 'yes'
}

/** Which rule applies to this visitor. */
export function region(): Region {
  if (served) return served.mode
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''
    return US.test(zone) ? 'opt-out' : 'opt-in'
  } catch {
    return 'opt-in'
  }
}

/** Whether the visitor has stored a choice. */
export function stored(): boolean {
  if (get(CONSENT_COOKIE) === undefined) return false
  return !served || get(CONSENT_VERSION_COOKIE) === String(served.version)
}

/** The visitor's choice: the stored one, else the regional default, with GPC applied. */
export function read(): Choice {
  const kept = stored() ? get(CONSENT_COOKIE) : undefined
  const on =
    kept !== undefined
      ? kept.split(',')
      : served
        ? (['analytics', 'marketing', 'ads'] as const).filter((k) => served!.defaults[k])
        : region() === 'opt-in'
          ? []
          : gpc()
            ? ['analytics']
            : ['analytics', 'marketing', 'ads']
  const has = (k: string) => on.includes(k)
  return { analytics: has('analytics'), marketing: has('marketing') && !gpc(), ads: has('ads') && !gpc() }
}

/** Whether the consent banner must be shown: an opt-in visitor who has not chosen. */
export function asks(): boolean {
  return typeof document !== 'undefined' && region() === 'opt-in' && !stored()
}

/** Whether a small notice must be shown: an opt-out visitor who has not yet seen it. */
export function notices(): boolean {
  return typeof document !== 'undefined' && region() === 'opt-out' && !stored()
}

/** The choice as the `consent` property and the cookie spell it. */
export function render(c: Choice): string {
  return (['analytics', 'marketing', 'ads'] as const).filter((k) => c[k]).join(',')
}

/**
 * Stores a choice and tells the page. The tags react without a reload: a
 * category just allowed loads its libraries, and Google's consent state is
 * updated. An ad library already running cannot be unloaded, so a choice that
 * withdraws marketing takes effect for what has not loaded yet and for every
 * later page.
 */
export function save(c: Choice): void {
  const out: Choice = { analytics: c.analytics, marketing: c.marketing && !gpc(), ads: c.ads && !gpc() }
  set(CONSENT_COOKIE, render(out), 395)
  set(CONSENT_VERSION_COOKIE, String(served?.version ?? 0), 395)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CONSENT_EVENT))
}

/** Accept every category. */
export const acceptAll = (): void => save({ analytics: true, marketing: true, ads: true })

/** Refuse every optional category. */
export const rejectAll = (): void => save({ analytics: false, marketing: false, ads: false })
