import { get, set } from './cookie'

// A browser a program drives — Playwright, Puppeteer, Selenium, a CI run or an
// uptime check — says so in `navigator.webdriver` (WebDriver §4.1). Its visits
// are ours, not an audience: the tag manager loads no platform pixel for it, and
// every event it sends carries `internal: true`, which cloud's forwarder and the
// insights bridge read to keep it off ad platforms and out of real traffic.
export const automated = (): boolean => typeof navigator !== 'undefined' && navigator.webdriver === true

// A person on our own team marks their browser once, with `?hz_internal=1` on
// any page (`?hz_internal=0` clears it): a first-party cookie on the registrable
// domain, so every subdomain of a site agrees. Their visits still load Google
// Analytics, tagged `traffic_type: internal` for the property's Internal Traffic
// filter, but no ad pixel, and their events carry `internal: true` like a driven
// browser's.
const MARK = 'hz_internal'

export function internal(): boolean {
  if (automated()) return true
  if (typeof window === 'undefined' || typeof document === 'undefined') return false
  // A host whose document keeps no cookies (a webview, a test double) has no mark.
  if (typeof document.cookie !== 'string') return false
  const asked = new URLSearchParams(window.location?.search ?? '').get(MARK)
  if (asked === '1') set(MARK, '1', 365)
  if (asked === '0') {
    set(MARK, '', 0)
    return false
  }
  return asked === '1' || get(MARK) === '1'
}
