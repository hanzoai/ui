// Cross-domain visitor continuity.
//
// Cookies and localStorage stop at the registrable domain, so a visitor who goes
// hanzo.ai -> hanzo.id (sign-in) -> back arrived as separate people on each host, and
// the journey across the sign-in redirect could not be read. A link between two
// Hanzo hosts therefore carries the visitor's identity in three short query
// parameters, and the destination adopts them before its first pageview and
// removes them from the address bar.
//
//   hz_aid  anonymous id      hz_sid  session id      hz_ft  first-touch attribution
//
// They are appended ONLY when the destination host belongs to a brand in ORG_DOMAIN:
// an id handed to a host outside the table would be handed to a stranger.

import { orgOf } from './org'
import type { Attribution } from './types'

export const LINK_PARAMS = { anon: 'hz_aid', session: 'hz_sid', firstTouch: 'hz_ft' } as const

/** Ids are v7 UUIDs; anything else in a URL is someone else's input and is refused. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isId = (v: string | null | undefined): v is string => !!v && UUID.test(v)

/** What a link carries. Any field may be absent. */
export interface LinkState {
  anonId?: string
  sessionId?: string
  firstTouch?: Attribution
}

/** First touch as a compact tuple: utm source, medium, campaign, term, content, refCode,
 *  referrer, channel. Short because it rides a URL; a tuple because keys cost bytes. */
export function encodeFirstTouch(a: Attribution): string {
  return JSON.stringify([
    a.utm.source, a.utm.medium, a.utm.campaign, a.utm.term, a.utm.content,
    a.refCode, a.referrer, a.channel,
  ].map((v) => v ?? ''))
}

export function decodeFirstTouch(raw: string | null | undefined): Attribution | undefined {
  if (!raw || raw.length > 1024) return undefined
  try {
    const t: unknown = JSON.parse(raw)
    if (!Array.isArray(t) || t.length !== 8 || t.some((v) => typeof v !== 'string')) return undefined
    const [source, medium, campaign, term, content, refCode, referrer, channel] = t as string[]
    const u = (v: string) => v || undefined
    return {
      utm: { source: u(source), medium: u(medium), campaign: u(campaign), term: u(term), content: u(content) },
      refCode: u(refCode),
      referrer: u(referrer),
      channel: u(channel),
    }
  } catch {
    return undefined
  }
}

/** linkUrl returns `url` with the visitor's identity appended when its host is
 *  Hanzo-owned and is not `fromHost`; otherwise `url` unchanged. Relative URLs
 *  resolve against `base`. Never throws. */
export function linkUrl(url: string, state: LinkState, fromHost: string, base?: string): string {
  let u: URL
  try {
    u = new URL(url, base)
  } catch {
    return url
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return url
  if (!orgOf(u.hostname) || u.hostname === fromHost) return url
  const set = (k: string, v: string | undefined) => v && u.searchParams.set(k, v)
  if (isId(state.anonId)) set(LINK_PARAMS.anon, state.anonId)
  if (isId(state.sessionId)) set(LINK_PARAMS.session, state.sessionId)
  if (state.firstTouch) set(LINK_PARAMS.firstTouch, encodeFirstTouch(state.firstTouch))
  return u.toString()
}

/** readLink parses what a link carried out of a location.search value. Invalid
 *  values are dropped, not repaired. */
export function readLink(search: string): LinkState {
  const q = new URLSearchParams(search || '')
  const a = q.get(LINK_PARAMS.anon)
  const s = q.get(LINK_PARAMS.session)
  return {
    anonId: isId(a) ? a : undefined,
    sessionId: isId(s) ? s : undefined,
    firstTouch: decodeFirstTouch(q.get(LINK_PARAMS.firstTouch)),
  }
}

/** stripLink returns the path, query and hash of `href` without the link parameters, or
 *  undefined when there were none. */
export function stripLink(href: string): string | undefined {
  const u = new URL(href)
  let hit = false
  for (const k of Object.values(LINK_PARAMS)) {
    if (u.searchParams.has(k)) {
      u.searchParams.delete(k)
      hit = true
    }
  }
  return hit ? u.pathname + u.search + u.hash : undefined
}
