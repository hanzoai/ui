// Pure attribution helpers: parse first-touch UTM/referrer/refCode from a URL,
// derive the acquisition channel, and compute the ISO week for the signup cohort.
// No I/O, no globals — trivially testable.

import type { Attribution } from './types'

const SOCIAL_HOSTS = [
  'facebook.', 'instagram.', 'twitter.', 'x.com', 't.co', 'linkedin.',
  'reddit.', 'youtube.', 'tiktok.', 'pinterest.', 'news.ycombinator.com',
]
const SEARCH_HOSTS = ['google.', 'bing.', 'duckduckgo.', 'yahoo.', 'baidu.', 'ecosia.']

/** parseAttribution reads UTM params + ref/refCode from a query string and pairs
 *  them with the referrer. `search` is a location.search value ("?utm_source=…"). */
export function parseAttribution(search: string, referrer: string): Attribution {
  const q = new URLSearchParams(search || '')
  const get = (k: string) => {
    const v = q.get(k)
    return v ? v.trim() : undefined
  }
  const a: Attribution = {
    utm: {
      source: get('utm_source'),
      medium: get('utm_medium'),
      campaign: get('utm_campaign'),
      term: get('utm_term'),
      content: get('utm_content'),
    },
    referrer: referrer ? referrer.trim() : undefined,
    refCode: get('ref') || get('refCode') || get('ref_code') || undefined,
  }
  a.channel = deriveChannel(a)
  return a
}

/** deriveChannel classifies the visit: paid | referral | social | organic | direct. */
export function deriveChannel(a: Attribution): string {
  const medium = (a.utm.medium || '').toLowerCase()
  if (/(cpc|ppc|paid|paidsearch|display|cpm)/.test(medium)) return 'paid'
  if (a.utm.source || a.utm.campaign) return 'campaign'
  if (a.refCode) return 'referral'
  const host = hostOf(a.referrer)
  if (!host) return 'direct'
  if (SOCIAL_HOSTS.some((h) => host.includes(h))) return 'social'
  if (SEARCH_HOSTS.some((h) => host.includes(h))) return 'organic'
  return 'referral'
}

/** hostOf extracts a bare lowercase host from a URL; "" when unparseable. */
export function hostOf(raw?: string): string {
  if (!raw) return ''
  let s = raw.trim()
  const scheme = s.indexOf('://')
  if (scheme >= 0) s = s.slice(scheme + 3)
  const cut = s.search(/[/?#]/)
  if (cut >= 0) s = s.slice(0, cut)
  const at = s.indexOf('@')
  if (at >= 0) s = s.slice(at + 1)
  const colon = s.indexOf(':')
  if (colon >= 0) s = s.slice(0, colon)
  return s.toLowerCase().trim()
}

/** hasAttribution reports whether anything was captured (so we don't persist an
 *  empty first-touch that would shadow a later real one). */
export function hasAttribution(a: Attribution): boolean {
  return Boolean(
    a.utm.source || a.utm.medium || a.utm.campaign || a.utm.term ||
      a.utm.content || a.refCode || (a.referrer && hostOf(a.referrer)),
  )
}

/** isoWeek returns the ISO-8601 week label, e.g. "2026-W28". */
export function isoWeek(d: Date): string {
  // Copy to UTC midnight; ISO week: Thursday-anchored.
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}
