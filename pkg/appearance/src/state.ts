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

export type { Preference }

/** One key, one shape. Namespaced because a surface's localStorage is shared. */
export const KEY = 'hanzo.appearance'

/** The published defaults — every knob at its neutral value, so an untouched
 *  install renders exactly what the design system publishes. */
export const DEFAULT: Preference = { type: 1, density: 'default' }

const isBrowser = () => typeof document !== 'undefined'

/**
 * What this device has chosen, or the defaults.
 *
 * Never throws: storage can be unavailable (private mode, an embedded frame with
 * no access) and a corrupt value is not worth taking a surface down for. An
 * unreadable preference is the same answer as an unset one.
 */
export function read(store: Storage | undefined = safeStore()): Preference {
  try {
    const raw = store?.getItem(KEY)
    if (!raw) return { ...DEFAULT }
    const p = JSON.parse(raw) as Preference
    if (!p || typeof p !== 'object') return { ...DEFAULT }
    // Only known axes survive. A stored key we do not recognise is either from a
    // future version or from someone editing localStorage, and neither should
    // reach a stylesheet.
    return {
      type: typeof p.type === 'number' && Number.isFinite(p.type) ? p.type : DEFAULT.type,
      density: p.density === 'compact' || p.density === 'comfortable' || p.density === 'default' ? p.density : DEFAULT.density,
      ...(typeof p.accent === 'string' ? { accent: p.accent } : {}),
    }
  } catch {
    return { ...DEFAULT }
  }
}

/** Persist, and answer whether it stuck — a caller that promised "saved" needs to
 *  know, the same rule the console's save indicator lives by. */
export function write(p: Preference, store: Storage | undefined = safeStore()): boolean {
  try {
    store?.setItem(KEY, JSON.stringify(p))
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
const KNOBS = ['--type-scale', '--density', '--primary', '--accent'] as const

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
export function bootScript(): string {
  return (
    `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(KEY)})||'{}');` +
    `var s=document.documentElement.style;` +
    `if(typeof p.type==='number')s.setProperty('--type-scale',String(Math.min(1.4,Math.max(0.85,p.type))));` +
    `var d={compact:'0.85',default:'1',comfortable:'1.15'}[p.density];if(d)s.setProperty('--density',d);` +
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
