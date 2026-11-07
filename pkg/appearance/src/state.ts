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
import { vars, type Arabic, type Scheme } from '@hanzo/design'
import { resolve, type Contrast, type Layers, type Preference, type Scope } from './scope'

export type { Arabic, Contrast, Preference, Scheme }

const COLOR_RE = /^(#[0-9a-fA-F]{3,8}|(?:rgb|hsl|oklch|oklab|lab|lch)a?\(\s*[-+0-9.%deg\s,/]+\)|[a-zA-Z]{3,20})$/

function groundInk(c: string): string {
  const m = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.exec(c)
  if (!m) return '#fafafa'
  const h = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1].slice(0, 6)
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? '#09090b' : '#fafafa'
}

const CONTRAST_PRESETS: Record<Contrast, Record<string, string>> = {
  oled: {
    '--background': '#000000',
    '--foreground': '#fafafa',
    '--text-primary': '#fafafa',
    '--pane-floor': '#000000',
    '--pane-fill': '#050505',
    '--card': '#080808',
    '--surface-card': '#080808',
    '--card-foreground': '#fafafa',
    '--popover': '#080808',
    '--popover-foreground': '#fafafa',
    '--muted': '#0d0d0d',
    '--secondary': '#161616',
    '--secondary-hover': '#1f1f1f',
    '--secondary-foreground': '#fafafa',
    '--composer-fill': '#111111',
    '--composer-ground': '#111111',
  },
  soft: {
    '--background': '#181818',
    '--foreground': '#fafafa',
    '--text-primary': '#fafafa',
    '--pane-floor': '#131312',
    '--pane-fill': '#1c1c1b',
    '--card': '#20201f',
    '--surface-card': '#20201f',
    '--card-foreground': '#fafafa',
    '--popover': '#20201f',
    '--popover-foreground': '#fafafa',
    '--muted': '#252523',
    '--secondary': '#2e2e2c',
    '--secondary-hover': '#383835',
    '--secondary-foreground': '#fafafa',
    '--composer-fill': '#272725',
    '--composer-ground': '#272725',
  },
  high: {
    '--background': '#000000',
    '--foreground': '#ffffff',
    '--text-primary': '#ffffff',
    '--pane-floor': '#000000',
    '--pane-fill': '#060606',
    '--card': '#0a0a0a',
    '--surface-card': '#0a0a0a',
    '--card-foreground': '#ffffff',
    '--popover': '#0a0a0a',
    '--popover-foreground': '#ffffff',
    '--muted': '#121212',
    '--secondary': '#1f1f1f',
    '--secondary-hover': '#292929',
    '--secondary-foreground': '#ffffff',
    '--composer-fill': '#141414',
    '--composer-ground': '#141414',
    '--border': 'rgb(255 255 255 / .18)',
  },
}

function effectiveScheme(p: Preference): Scheme | undefined {
  if (p.background !== undefined) {
    const bg = p.background.trim()
    if (COLOR_RE.test(bg)) {
      return groundInk(bg) === '#09090b' ? 'light' : 'dark'
    }
  }
  if (p.contrast && p.contrast in CONTRAST_PRESETS) {
    return 'dark'
  }
  return p.theme
}

function varsFor(p: Preference): Record<string, string> {
  const out: Record<string, string> = { ...vars(p) }
  if (p.contrast && p.contrast in CONTRAST_PRESETS) {
    Object.assign(out, CONTRAST_PRESETS[p.contrast])
  }
  if (p.background !== undefined) {
    const bg = p.background.trim()
    if (COLOR_RE.test(bg)) {
      const fg = groundInk(bg)
      const isLight = fg === '#09090b'
      const mixTarget = isLight ? 'black' : 'white'
      out['--background'] = bg
      out['--foreground'] = fg
      out['--text-primary'] = fg
      out['--pane-floor'] = `color-mix(in oklch, ${bg} 95%, black)`
      out['--pane-fill'] = `color-mix(in oklch, ${bg} 97%, ${mixTarget})`
      out['--card'] = `color-mix(in oklch, ${bg} 95%, ${mixTarget})`
      out['--surface-card'] = `color-mix(in oklch, ${bg} 95%, ${mixTarget})`
      out['--card-foreground'] = fg
      out['--popover'] = `color-mix(in oklch, ${bg} 92%, ${mixTarget})`
      out['--popover-foreground'] = fg
      out['--muted'] = `color-mix(in oklch, ${bg} 92%, ${mixTarget})`
      out['--secondary'] = `color-mix(in oklch, ${bg} 90%, ${mixTarget})`
      out['--secondary-hover'] = `color-mix(in oklch, ${bg} 84%, ${mixTarget})`
      out['--secondary-foreground'] = fg
      out['--composer-fill'] = `color-mix(in oklch, ${bg} 90%, ${mixTarget})`
      out['--composer-ground'] = `color-mix(in oklch, ${bg} 90%, ${mixTarget})`
    }
  }
  if (p.highlight !== undefined) {
    const hl = p.highlight.trim()
    if (COLOR_RE.test(hl)) {
      out['--highlight'] = hl
      out['--selection'] = `color-mix(in oklab, ${hl} 28%, transparent)`
      out['--ring'] = `color-mix(in oklab, ${hl} 55%, transparent)`
      out['--ring-halo'] = `color-mix(in oklab, ${hl} 18%, transparent)`
      out['--border-focus'] = `color-mix(in oklab, ${hl} 50%, transparent)`
      out['--border-selected'] = `color-mix(in oklab, ${hl} 65%, transparent)`
    }
  }
  return out
}

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
 * The Arabic companions design names, each as `--font-arabic-<name>` — the
 * values a person can choose besides `default`.
 */
export const COMPANIONS = ['kufi', 'sans', 'plex'] as const satisfies readonly Arabic[]

/**
 * The companion the document draws Arabic in: `--font-arabic` against each
 * `--font-arabic-<name>`, computed. It is what a control marks when nobody chose,
 * read off the page rather than assumed, so the mark follows the token file's
 * default wherever it moves. Undefined without a document or the tokens.
 */
export function companion(
  root: HTMLElement | undefined = isBrowser() ? document.documentElement : undefined,
): (typeof COMPANIONS)[number] | undefined {
  if (!root) return undefined
  const css = getComputedStyle(root)
  const now = css.getPropertyValue('--font-arabic').trim()
  return now ? COMPANIONS.find((c) => css.getPropertyValue(`--font-arabic-${c}`).trim() === now) : undefined
}

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
      ...(typeof p.modular === 'number' && Number.isFinite(p.modular) ? { modular: p.modular } : {}),
      ...(p.density === 'compact' || p.density === 'comfortable' || p.density === 'default' ? { density: p.density } : {}),
      ...(p.font === 'default' || p.font === 'system' || p.font === 'serif' || p.font === 'mono' ? { font: p.font } : {}),
      ...(p.arabic === 'default' || COMPANIONS.includes(p.arabic as never) ? { arabic: p.arabic } : {}),
      ...(p.width === 'narrow' || p.width === 'default' || p.width === 'wide' ? { width: p.width } : {}),
      ...(typeof p.accent === 'string' ? { accent: p.accent } : {}),
      ...(typeof p.highlight === 'string' ? { highlight: p.highlight } : {}),
      ...(typeof p.background === 'string' ? { background: p.background } : {}),
      ...(p.contrast === 'oled' || p.contrast === 'soft' || p.contrast === 'high' ? { contrast: p.contrast } : {}),
      ...(p.theme === 'system' || p.theme === 'light' || p.theme === 'dark' ? { theme: p.theme } : {}),
      ...(p.radius === 'sharp' || p.radius === 'default' || p.radius === 'round' ? { radius: p.radius } : {}),
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

/** Dispatched on `window` whenever `write()` updates the browser's appearance store. */
export const CHANGE = 'hanzo:appearance'

/** Persist, and answer whether it stuck — a caller that promised "saved" needs to
 *  know, the same rule the console's save indicator lives by. */
export function write(p: Preference, { scope = 'everywhere', org, store = safeStore() }: At = {}): boolean {
  try {
    store?.setItem(keyFor(scope, org), JSON.stringify(p))
    if (typeof window !== 'undefined' && typeof Event === 'function') {
      window.dispatchEvent(new Event(CHANGE))
    }
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
 *
 * The theme is the one axis that is a CLASS rather than a property: design's
 * `.light` and gui's `.t_light` / `.t_dark` are what every sheet keys on, so the
 * theme is painted as those classes (see `paint`).
 *
 * Applied to the document's own root, the result is also kept as what the next
 * load paints before any script of ours can run (`bootScript`), so a reload and
 * a navigation open in the person's colours rather than flashing the defaults.
 */
export function apply(
  p: Preference,
  root: HTMLElement | undefined = isBrowser() ? document.documentElement : undefined,
  { store = safeStore() }: { store?: Storage } = {},
): void {
  if (!root) return
  const next = varsFor(p)
  for (const name of KNOBS) {
    const v = next[name]
    if (v) root.style.setProperty(name, v)
    else root.style.removeProperty(name)
  }
  const scheme = effectiveScheme(p)
  paint(scheme, root)
  if (isBrowser() && root === document.documentElement) {
    follow(scheme)
    try {
      store?.setItem(PAINTED, JSON.stringify({ vars: next, ...(scheme ? { theme: scheme } : {}) }))
    } catch {
      // A full or blocked store costs the next load its head start, nothing else.
    }
  }
}

/** What the last `apply()` put on this device's document — the boot script's input. */
export const PAINTED = `${KEY}.painted`

/** Whether a scheme comes out dark on this device right now. */
export const dark = (theme: Scheme): boolean =>
  theme === 'dark' ||
  (theme === 'system' && typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches)

/**
 * Put a theme on the document as the classes every sheet keys on.
 *
 * Both vocabularies at once, because both are read: @hanzo/design retunes under
 * `.light`, and gui scopes every theme variable to `:root.t_light` / `.t_dark`.
 * Hosts used to keep them in step with a mutation observer of their own; one
 * writer that says both is the same answer with nothing to keep in step.
 *
 * `data-scheme` records that the theme was set HERE. A theme nobody chose is left
 * to whoever else answers it (the server's markup, design's dark default) — but
 * once one was chosen and is then cleared, it is handed back to design's dark
 * rather than left stuck on the last choice.
 */
export function paint(theme: Scheme | undefined, root: HTMLElement): void {
  if (!theme && !root.hasAttribute('data-scheme')) return
  const night = theme ? dark(theme) : true
  root.classList.toggle('light', !night)
  root.classList.toggle('dark', night)
  root.classList.toggle('t_light', !night)
  root.classList.toggle('t_dark', night)
  root.style.colorScheme = night ? 'dark' : 'light'
  if (theme) root.setAttribute('data-scheme', theme)
  else root.removeAttribute('data-scheme')
}

/**
 * `system` keeps following the device, not only at the moment it was chosen.
 * One listener for the document, installed while the theme is `system` and
 * removed the moment it is not — so it cannot pile up across remounts.
 */
let watching: { query: MediaQueryList; on: () => void } | undefined
function follow(theme: Scheme | undefined): void {
  if (theme === 'system') {
    if (watching || typeof matchMedia !== 'function') return
    const query = matchMedia('(prefers-color-scheme: dark)')
    const on = () => paint('system', document.documentElement)
    query.addEventListener?.('change', on)
    watching = { query, on }
  } else if (watching) {
    watching.query.removeEventListener?.('change', watching.on)
    watching = undefined
  }
}

/**
 * Every property `vars()` can emit — the removal list has to be exhaustive, or
 * clearing an axis would leave the last value stuck on the document.
 *
 * Asked of `vars()` itself, with every axis set, rather than typed out: the list
 * was a copy once, and the accent's ink and hover — added to design after the
 * copy was made — would have been written by an accent and never removed by a
 * reset. A name design emits is a name this removes, by construction.
 */
export const KNOBS: readonly string[] = Object.keys(
  varsFor({
    type: 1,
    ratio: 1,
    modular: 1.25,
    density: 'compact',
    font: 'serif',
    arabic: 'sans',
    width: 'wide',
    accent: '#000',
    highlight: '#000',
    background: '#000',
    contrast: 'high',
    radius: 'round',
  }),
)

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
  const entries = Object.entries(varsFor(p))
  if (entries.length === 0) return ''
  return `html:root{${entries.map(([k, v]) => `${k}:${v}`).join(';')}}`
}

/**
 * A tiny script to inline in `<head>`, BEFORE the stylesheet paints.
 *
 * It REPLAYS what `apply()` last put on this device's document — every custom
 * property and the theme — and computes nothing. That is the whole design: the
 * script has to be a string, so anything it computed would be a second copy of
 * `vars()`, and the copy it used to be had already fallen behind — it painted
 * type, density, font and width and never the accent, so every load opened in
 * the default colour and changed it when React mounted.
 *
 * `base` is the install's own default, painted on a device that has never
 * applied anything. It is resolved here, at render time, through the same
 * `vars()`, because a boot script cannot await anything.
 */
export function bootScript({ base }: { base?: Preference } = {}): string {
  const seed = JSON.stringify({ vars: varsFor(base ?? {}), ...(base?.theme ? { theme: base.theme } : {}) })
  return (
    `(function(){try{var d=document.documentElement,s=d.style,c=null;` +
    `try{c=JSON.parse(localStorage.getItem(${JSON.stringify(PAINTED)})||'null')}catch(e){}` +
    `if(!c||typeof c!=='object')c=${seed};var v=c.vars||{};` +
    `for(var k in v)if(k.slice(0,2)==='--'&&typeof v[k]==='string')s.setProperty(k,v[k]);` +
    `var t=c.theme;if(t==='light'||t==='dark'||t==='system'){` +
    `var n=t==='dark'||(t==='system'&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches);` +
    `var l=d.classList;l.toggle('light',!n);l.toggle('dark',n);l.toggle('t_light',!n);l.toggle('t_dark',n);` +
    `s.colorScheme=n?'dark':'light';d.setAttribute('data-scheme',t)}` +
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
