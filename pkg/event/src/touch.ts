// The ad click a visitor arrived on, kept first-party so a conversion days later
// is credited to it even when the ad tags never loaded.
//
// On every page load the click ids in the address are read: gclid, gbraid and
// wbraid (Google), fbclid (Meta), li_fat_id (LinkedIn), twclid (X), ttclid
// (TikTok). When any is there the whole set replaces the last one in `hz_touch`
// with the time it was captured: the last click is the one credited. It is kept
// 90 days, the lookback cloud applies before it offers a click to a platform
// (apps/destination/touch.go).
//
// Beside it are the browser ids the platforms match on. `_fbc` is Meta's click
// cookie, built from fbclid in the shape the Pixel would write it; `_fbp` is its
// browser id. `cid` is GA4's client id: the last two fields of `_ga`, or a
// first-party `hz_cid` of the same shape when gtag.js never ran.
//
// Nothing here runs without consent: the click and the Meta ids need Marketing,
// the client id needs Analytics.

import type { Choice } from './consent'
import { get, set } from './cookie'

export const CLICK_IDS = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'li_fat_id', 'twclid', 'ttclid'] as const

const DAYS = 90
const now = () => Math.floor(Date.now() / 1000)
const rand = () => Math.floor(Math.random() * 2 ** 31)

/** Records this page's click and the browser ids. Call once per page load. */
export function capture(c: Choice): void {
  if (typeof window === 'undefined') return
  if (c.marketing) {
    const q = new URLSearchParams(window.location.search)
    const click: Record<string, string | number> = {}
    for (const k of CLICK_IDS) {
      const v = q.get(k)?.trim()
      if (v) click[k] = v
    }
    if (Object.keys(click).length) {
      click.clicked = now()
      set('hz_touch', JSON.stringify(click), DAYS)
      if (click.fbclid) set('_fbc', `fb.1.${Date.now()}.${click.fbclid}`, DAYS)
    }
    if (!get('_fbp')) set('_fbp', `fb.1.${Date.now()}.${rand()}`, DAYS)
  }
  if (c.analytics && !get('_ga') && !get('hz_cid')) set('hz_cid', `${rand()}.${now()}`, 730)
}

/** The properties an event carries for cloud to match it on. */
export function touch(c: Choice): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  if (c.marketing) {
    try {
      Object.assign(out, JSON.parse(get('hz_touch') ?? '{}'))
    } catch {
      /* a cookie that does not parse names no click */
    }
    const fbc = get('_fbc')
    const fbp = get('_fbp')
    if (fbc) out.fbc = fbc
    if (fbp) out.fbp = fbp
  }
  if (c.analytics) {
    const ga = get('_ga')?.split('.')
    const cid = ga && ga.length >= 4 ? ga.slice(-2).join('.') : get('hz_cid')
    if (cid) out.cid = cid
  }
  return out
}
