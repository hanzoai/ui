/**
 * Where a person's appearance preference is kept, and when it is applied.
 *
 * The TRANSFORM lives in @hanzo/design (`vars()`): three knobs — `--type-scale`,
 * `--density`, `--primary`/`--accent` — that every ramp multiplies by. This file
 * owns only the two things a pure function cannot: storage and the document. So
 * there is one place a preference becomes CSS, and one place it becomes bytes,
 * and neither knows about the other's job.
 *
 * No React here on purpose. A server render, a browser extension and an embedded
 * preview all need to apply a preference, and only one of them has hooks.
 */
import { vars, css, type Preference } from '@hanzo/design'
import { resolve, type Layers, type Scope } from './scope'

export type { Preference }

/** One key, one shape. Namespaced because a surface's localStorage is shared. */
export const KEY = 'hanzo.appearance'

/**
 * Where a personal preference is kept for a given scope.
 *
 * The everywhere-layer keeps the bare key it has always had, so an install that
 * predates scoping reads back unchanged and lands where it belongs — a
 * preference set before there were scopes was, in fact, meant for everywhere.
 * A per-org override is the same key suffixed with the org, so the two never
 * overwrite each other and clearing one leaves the other standing.
 */
export const keyFor = (scope: Scope, org?: string): string =>
  scope === 'org' && org ? `${KEY}@${org}` : KEY

/** Which preference is being read or written, and out of which storage. */
export interface At {
  scope?: Scope
  /** The org in scope. Required for `scope: 'org'`; ignored otherwise. */
  org?: string
  store?: Storage
}

/** What an unset axis READS AS, for a control that has to show something
 *  selected. Never written to the document — see `read()`. */
export const DEFAULT: Preference = { type: 1, density: 'default' }

const isBrowser = () => typeof document !== 'undefined'

/**
 * What this device has CHOSEN — and nothing else.
 *
 * An axis nobody set is absent, not neutral. The difference is invisible at
 * `:root` (the token sheet declares 1 anyway) and decisive everywhere else: a
 * value here becomes an INLINE custom property on <html>, which outranks any
 * stylesheet, so writing a neutral 1 silently overrides a brand that set its
 * own scale. `apply()` removes an absent axis for exactly that reason, and
 * merging DEFAULT in here made that branch unreachable — every untouched
 * install stamped `--type-scale: 1; --density: 1` over whatever the brand
 * published. `bootScript()` already got this right (it sets a property only
 * when one is stored), so the two halves of this module disagreed on every
 * load: the head script deferred, then the mount overrode.
 *
 * Absent is also what the panel expects — it displays `pref.type ?? 1`.
 *
 * Never throws: storage can be unavailable (private mode, an embedded frame
 * with no access) and a corrupt value is not worth taking a surface down for.
 * An unreadable preference is the same answer as an unset one.
 */
export function read({ scope = 'everywhere', org, store = safeStore() }: At = {}): Preference {
  try {
    const raw = store?.getItem(keyFor(scope, org))
    if (!raw) return {}
    const p = JSON.parse(raw) as Preference
    if (!p || typeof p !== 'object') return {}
    // Only known axes survive. A stored key we do not recognise is either from a
    // future version or from someone editing localStorage, and neither should
    // reach a stylesheet.
    return {
      ...(typeof p.type === 'number' && Number.isFinite(p.type) ? { type: p.type } : {}),
      ...(typeof p.ratio === 'number' && Number.isFinite(p.ratio) ? { ratio: p.ratio } : {}),
      ...(p.density === 'compact' || p.density === 'comfortable' || p.density === 'default' ? { density: p.density } : {}),
      ...(p.font === 'default' || p.font === 'system' || p.font === 'serif' || p.font === 'mono' ? { font: p.font } : {}),
      ...(p.width === 'narrow' || p.width === 'default' || p.width === 'wide' ? { width: p.width } : {}),
      ...(typeof p.accent === 'string' ? { accent: p.accent } : {}),
    }
  } catch {
    return {}
  }
}

/**
 * Both personal layers at once, ready to hand to `resolve()`.
 *
 * The per-org layer is only read when an org is actually in scope — with none,
 * there is no such preference to have, and inventing a key for `undefined` would
 * make one org's settings the home of everybody who happened to be signed out.
 */
export function readLayers({ org, store = safeStore() }: At = {}): Layers {
  return {
    user: read({ scope: 'everywhere', store }),
    ...(org ? { userOrg: read({ scope: 'org', org, store }) } : {}),
  }
}

/** Persist, and answer whether it stuck — a caller that promised "saved" needs to
 *  know, the same rule the console's save indicator lives by. */
export function write(p: Preference, { scope = 'everywhere', org, store = safeStore() }: At = {}): boolean {
  try {
    store?.setItem(keyFor(scope, org), JSON.stringify(p))
    return !!store
  } catch {
    return false
  }
}

/**
 * Put a preference on the document.
 *
 * The knobs land as INLINE custom properties on `<html>`, which is `:root`, so
 * they win over every stylesheet without needing a selector to out-specify — and
 * they reach @hanzo/gui, which resolves sizes in JS and applies them inline as
 * `var(--text-base, 14px)`. That var still reads from the cascade at the element,
 * so one property on the root retunes ~1600 `fontSize="$n"` call sites.
 *
 * An axis the preference does not set is REMOVED rather than written as a
 * neutral value, so the stylesheet's own default is what answers. Writing `1`
 * would look identical and would silently outrank a brand that set its own.
 */
export function apply(p: Preference, root: HTMLElement | undefined = isBrowser() ? document.documentElement : undefined): void {
  if (!root) return
  const next = vars(p)
  for (const name of KNOBS) {
    const v = next[name]
    if (v) root.style.setProperty(name, v)
    else root.style.removeProperty(name)
  }
}

/** Every property `vars()` can emit — the removal list has to be exhaustive, or
 *  clearing an axis would leave the last value stuck on the document. */
const KNOBS = [
  '--type-scale',
  '--type-ratio',
  '--density',
  '--font-sans',
  '--container-max',
  '--container-prose',
  '--container-wide',
  '--primary',
  '--accent',
] as const

/**
 * What this person, in this org, on this device, should actually see.
 *
 * The one call a surface needs: it collects the two personal layers off the
 * device, stacks them under whatever the install and the org supplied, and hands
 * back the resolved preference along with who decided each axis.
 *
 * `install` and `org` are ARGUMENTS because they are not the browser's to know —
 * an org's branding is a row on a server and the install's default is built into
 * the host. Reading them here would mean guessing, or fetching, and this module
 * is the one that must stay synchronous enough to run before first paint.
 */
export function current({ install, org, orgId, store }: { install?: Preference; org?: Preference; orgId?: string; store?: Storage } = {}) {
  return resolve({ install, org, ...readLayers({ org: orgId, store }) })
}

/**
 * The preference as a `<style>` body, for a server render or an inline head
 * script — so the first paint is already correct.
 *
 * Without this the page paints at the published defaults and then jumps when JS
 * runs, which is worse than not offering the setting: the flash reads as a bug
 * on every single load.
 */
export function style(p: Preference): string {
  return css(p, 'html:root')
}

/**
 * A tiny script to inline in `<head>`, BEFORE the stylesheet paints.
 *
 * It reads the same key and writes the same properties this module does — it has
 * to be a string because it must run before any bundle, and it stays this small
 * for the same reason. Anything it cannot do (validation, colour checking) is
 * done again by `apply()` the moment React mounts.
 */
export function bootScript({ org, base }: { org?: string; base?: Preference } = {}): string {
  // The install's and the org's defaults are known at render time, so they are
  // BAKED into the script rather than fetched by it — a boot script cannot await
  // anything, and a layer that arrives after first paint is the flash this
  // function exists to prevent.
  const seed = JSON.stringify(base ?? {})
  const keys = JSON.stringify(org ? [KEY, keyFor('org', org)] : [KEY])
  return (
    `(function(){try{var p=${seed};` +
    // Narrowest last, and axis by axis — the same rule resolve() follows, so the
    // pre-paint answer and the post-mount one cannot disagree.
    `${keys}.forEach(function(k){var o=JSON.parse(localStorage.getItem(k)||'{}');` +
    `for(var a in o)if(o[a]!==undefined&&o[a]!=='')p[a]=o[a]});` +
    `var s=document.documentElement.style;` +
    `if(typeof p.type==='number')s.setProperty('--type-scale',String(Math.min(1.4,Math.max(0.85,p.type))));` +
    `if(typeof p.ratio==='number')s.setProperty('--type-ratio',String(Math.min(1.5,Math.max(0.75,p.ratio))));` +
    `var d={compact:'0.85',default:'1',comfortable:'1.15'}[p.density];if(d)s.setProperty('--density',d);` +
    `var f={system:'ui-sans-serif, system-ui, -apple-system, sans-serif',serif:'var(--font-serif)',mono:'var(--font-mono)'}[p.font];` +
    `if(f)s.setProperty('--font-sans',f);` +
    `var w={narrow:['64rem','40rem','58rem'],wide:['96rem','56rem','86rem']}[p.width];` +
    `if(w){s.setProperty('--container-max',w[0]);s.setProperty('--container-prose',w[1]);s.setProperty('--container-wide',w[2])}` +
    `}catch(e){}})()`
  )
}

function safeStore(): Storage | undefined {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : undefined
  } catch {
    return undefined // storage blocked (embedded frame, private mode)
  }
}
