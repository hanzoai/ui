/**
 * The Hanzo colour system — the authoritative source.
 *
 * Hanzo is monochrome: one hue rendered through an opacity ladder. DARK IS THE
 * DEFAULT THEME. The dark palette is derived from the chat surface in
 * hanzoai/extension (packages/browser/src/sidebar.css): a #0a0a0a ground,
 * #fafafa ink, and boundaries drawn as LOW-ALPHA HAIRLINES. Two properties are
 * load-bearing:
 *
 *   1. Borders are alpha, not hex. rgb(255 255 255 / .10) composites correctly
 *      on #0a0a0a AND on #262626; a solid #1f1f1f reads on the page and vanishes
 *      the moment it lands on a lifted surface.
 *   2. Surfaces lift by tiny steps (0a -> 0f -> 17 -> 26) and ink is a graded
 *      ramp (#fafafa -> .78 -> .55 -> #a3a3a3), not one flat white.
 *
 * This module is the ONE place those values live. `scripts/gen-css.ts` emits
 * the CSS custom-property bundle (:root + .light) from it, and @hanzo/design and
 * @hanzo/brand embed that generated CSS — so an edit here propagates to every
 * surface (React via the TS, Go/Gitea/Argo via the generated CSS) with nothing
 * retyped. Values below are RAW CSS strings (a value may be a var() reference)
 * so the emitted bundle is identical to what those consumers already ship.
 *
 * Light theme restates every token whose dark value is a white-alpha rung as the
 * matching black-alpha, plus the semantic canvases. Tokens NOT restated under
 * .light (the neutral ladder, the opacity ladder, --brand*, the surface recipes,
 * --surface-0..3, --text-helper, the state hues) inherit from :root by design.
 */

export interface TokenVar {
  /** CSS custom-property name WITHOUT the leading `--`. */
  name: string
  /** Raw CSS value, exactly as emitted (may be a `var(--x)` reference). */
  value: string
  /** Optional trailing comment, emitted inline after the declaration. */
  comment?: string
}

export interface TokenSection {
  /** Banner emitted above the group. */
  title: string
  vars: TokenVar[]
}

/** Dark theme — the `:root{}` block (the default). */
export const dark: TokenSection[] = [
  {
    title: 'base neutral ladder',
    vars: [
      { name: 'neutral-50', value: '#FAFAFA' },
      { name: 'neutral-100', value: '#F5F5F5' },
      { name: 'neutral-200', value: '#E5E5E5' },
      { name: 'neutral-300', value: '#D4D4D4' },
      { name: 'neutral-400', value: '#A3A3A3' },
      { name: 'neutral-500', value: '#737373' },
      { name: 'neutral-600', value: '#525252' },
      { name: 'neutral-700', value: '#404040' },
      { name: 'neutral-800', value: '#262626' },
      { name: 'neutral-900', value: '#171717' },
      { name: 'neutral-950', value: '#0A0A0A' },
      { name: 'pure-black', value: '#000000' },
      { name: 'pure-white', value: '#FFFFFF' },
      { name: 'hanzo-black', value: '#0A0A0B' },
      { name: 'hanzo-white', value: '#FFFFFF' },
    ],
  },
  {
    title: 'the opacity ladder: the real palette',
    vars: [
      { name: 'white-03', value: 'rgb(255 255 255 / .03)', comment: 'the raised fill' },
      { name: 'white-05', value: 'rgb(255 255 255 / .05)' },
      { name: 'white-06', value: 'rgb(255 255 255 / .06)' },
      { name: 'white-08', value: 'rgb(255 255 255 / .08)' },
      { name: 'white-10', value: 'rgb(255 255 255 / .10)' },
      { name: 'white-14', value: 'rgb(255 255 255 / .14)', comment: 'selection wash' },
      { name: 'white-15', value: 'rgb(255 255 255 / .15)' },
      { name: 'white-16', value: 'rgb(255 255 255 / .16)' },
      { name: 'white-18', value: 'rgb(255 255 255 / .18)', comment: 'selection tint' },
      { name: 'white-20', value: 'rgb(255 255 255 / .20)' },
      { name: 'white-22', value: 'rgb(255 255 255 / .22)' },
      { name: 'white-30', value: 'rgb(255 255 255 / .30)' },
      { name: 'white-40', value: 'rgb(255 255 255 / .40)' },
      { name: 'white-45', value: 'rgb(255 255 255 / .45)', comment: 'the dimmest ink' },
      { name: 'white-55', value: 'rgb(255 255 255 / .55)' },
      { name: 'white-60', value: 'rgb(255 255 255 / .60)' },
      { name: 'white-78', value: 'rgb(255 255 255 / .78)' },
      { name: 'white-80', value: 'rgb(255 255 255 / .80)' },
      { name: 'white-92', value: 'rgb(255 255 255 / .92)', comment: 'body ink' },
    ],
  },
  {
    title: 'semantic aliases (dark, the default)',
    vars: [
      { name: 'background', value: '#0a0a0a' },
      { name: 'foreground', value: '#e5e5e5', comment: 'the graded ink, one rung short of #fafafa' },
      { name: 'card', value: '#0f0f0f' },
      { name: 'card-foreground', value: '#e5e5e5' },
      { name: 'popover', value: '#0f0f0f' },
      { name: 'popover-foreground', value: '#e5e5e5' },
      { name: 'primary', value: '#fafafa' },
      { name: 'primary-hover', value: '#e5e5e5' },
      { name: 'primary-foreground', value: '#0a0a0a' },
      { name: 'secondary', value: '#262626' },
      { name: 'secondary-hover', value: '#333333' },
      { name: 'secondary-foreground', value: '#fafafa' },
      { name: 'muted', value: '#171717' },
      { name: 'muted-foreground', value: '#a3a3a3' },
      { name: 'accent', value: '#262626' },
      { name: 'accent-foreground', value: '#fafafa' },
      { name: 'destructive', value: 'var(--state-error)' },
      { name: 'destructive-hover', value: '#dc2626', comment: 'red-600 — deepens under the cursor' },
      { name: 'destructive-foreground', value: '#fafafa' },
    ],
  },
  {
    title: 'boundaries — ONE ladder, cut from alpha, graded by duty',
    vars: [
      { name: 'border', value: 'var(--white-10)', comment: 'the hairline' },
      { name: 'border-strong', value: 'var(--white-16)', comment: 'hover, emphasis' },
      { name: 'border-control', value: 'var(--white-15)', comment: "a control's resting edge" },
      { name: 'border-focus', value: 'var(--white-22)', comment: 'that control, focused' },
      { name: 'border-selected', value: 'var(--white-30)', comment: 'the thing currently CHOSEN' },
      { name: 'input', value: 'var(--border-control)', comment: 'shadcn `border-input` — a control' },
      { name: 'ring', value: 'var(--white-40)', comment: 'the focus indicator — 3:1 non-text contrast' },
      { name: 'ring-halo', value: 'var(--white-10)', comment: 'the soft halo outside the ring' },
      { name: 'brand', value: '#e4e4e7' },
      { name: 'brand-foreground', value: '#09090b' },
      { name: 'brand-muted', value: '#a3a3a3' },
      { name: 'black', value: '#000000' },
      { name: 'white', value: '#fafafa' },
      { name: 'selection', value: 'var(--white-20)' },
    ],
  },
  {
    title: 'glass: the lift',
    vars: [
      { name: 'glass', value: 'var(--white-05)' },
      { name: 'glass-strong', value: 'var(--white-08)' },
    ],
  },
  {
    title: 'surface recipes',
    vars: [
      { name: 'surface-page', value: 'var(--background)' },
      { name: 'surface-card', value: 'rgb(38 38 38 / .5)', comment: '-> #181818 on the page' },
      { name: 'surface-card-emphasis', value: 'rgb(38 38 38 / .75)', comment: '-> #1f1f1f — featured' },
      { name: 'surface-card-quiet', value: 'rgb(38 38 38 / .35)', comment: '-> #141414 — story cards' },
      { name: 'surface-overlay', value: 'rgb(23 23 23 / .92)', comment: 'dropdown / popover panels' },
      { name: 'surface-header', value: 'rgb(0 0 0 / .7)', comment: 'fixed nav, with backdrop blur' },
      { name: 'surface-scrim', value: 'rgb(0 0 0 / .8)', comment: 'the dialog / sheet backdrop' },
    ],
  },
  {
    title: 'the numeric surface ladder',
    vars: [
      { name: 'surface-0', value: 'var(--background)' },
      { name: 'surface-1', value: 'var(--card)' },
      { name: 'surface-2', value: 'var(--muted)' },
      { name: 'surface-3', value: 'var(--secondary)' },
    ],
  },
  {
    title: 'text ranks — a graded ramp, not one flat white',
    vars: [
      { name: 'text-primary', value: '#fafafa' },
      { name: 'text-secondary', value: 'var(--white-78)' },
      { name: 'text-tertiary', value: 'var(--white-55)' },
      { name: 'text-helper', value: 'var(--muted-foreground)' },
      { name: 'text-disabled', value: 'var(--white-30)' },
    ],
  },
  {
    title: 'the ONLY permitted hues (DESIGN.md §2.4)',
    vars: [
      { name: 'state-error', value: '#ef4444', comment: 'red-500 — destructive / blocking error' },
      { name: 'state-error-text', value: '#fca5a5', comment: 'red-300' },
      { name: 'state-error-bg', value: 'rgb(239 68 68 / .1)' },
      { name: 'state-online', value: '#4ade80', comment: 'green-400 — live status dot' },
      { name: 'state-success', value: '#22c55e', comment: 'green-500 — "Free" / "Save N%" callouts' },
      { name: 'chrome-dot-red', value: 'rgb(239 68 68 / .6)' },
      { name: 'chrome-dot-yellow', value: 'rgb(234 179 8 / .6)' },
      { name: 'chrome-dot-green', value: 'rgb(34 197 94 / .6)' },
    ],
  },
]

/** Light theme — the same tokens, inverted (the `.light{}` block). */
export const light: TokenSection[] = [
  {
    title: 'semantic aliases (light)',
    vars: [
      { name: 'background', value: '#f7f7f7' },
      { name: 'foreground', value: '#0a0a0a' },
      { name: 'card', value: '#f2f2f2' },
      { name: 'card-foreground', value: '#0a0a0a' },
      { name: 'popover', value: '#fbfbfb' },
      { name: 'popover-foreground', value: '#0a0a0a' },
      { name: 'primary', value: '#0a0a0a' },
      { name: 'primary-hover', value: '#262626' },
      { name: 'primary-foreground', value: '#fafafa' },
      { name: 'secondary', value: '#e4e4e4' },
      { name: 'secondary-hover', value: '#e0e0e0' },
      { name: 'secondary-foreground', value: '#0a0a0a' },
      { name: 'muted', value: '#ededed' },
      { name: 'muted-foreground', value: '#525252' },
      { name: 'accent', value: '#e4e4e4' },
      { name: 'accent-foreground', value: '#0a0a0a' },
      { name: 'destructive', value: 'var(--state-error)' },
      { name: 'destructive-hover', value: '#dc2626' },
      { name: 'destructive-foreground', value: '#ffffff' },
    ],
  },
  {
    title: 'boundaries — restated as black-alpha',
    vars: [
      { name: 'border', value: 'rgb(0 0 0 / .10)' },
      { name: 'border-strong', value: 'rgb(0 0 0 / .16)' },
      { name: 'border-control', value: 'rgb(0 0 0 / .15)' },
      { name: 'border-focus', value: 'rgb(0 0 0 / .32)', comment: 'pushed past .22: black-on-white reads fainter' },
      { name: 'border-selected', value: 'rgb(0 0 0 / .42)' },
      { name: 'input', value: 'var(--border-control)' },
      { name: 'ring', value: 'rgb(0 0 0 / .5)', comment: '3.98:1 on #ffffff, 3.67:1 on #f5f5f5' },
      { name: 'ring-halo', value: 'rgb(0 0 0 / .07)' },
      { name: 'black', value: '#0a0a0a' },
      { name: 'white', value: '#ffffff' },
      { name: 'selection', value: 'rgb(0 0 0 / .16)' },
    ],
  },
  {
    title: 'glass + surfaces (light)',
    vars: [
      { name: 'glass', value: 'rgb(0 0 0 / .04)' },
      { name: 'glass-strong', value: 'rgb(0 0 0 / .07)' },
      { name: 'surface-card', value: '#f2f2f2' },
      { name: 'surface-card-emphasis', value: '#fdfdfd' },
      { name: 'surface-card-quiet', value: '#f5f5f5' },
      { name: 'surface-overlay', value: 'rgb(255 255 255 / .95)' },
      { name: 'surface-header', value: 'rgb(255 255 255 / .8)' },
      { name: 'surface-scrim', value: 'rgb(0 0 0 / .5)' },
    ],
  },
  {
    title: 'text ranks (light)',
    vars: [
      { name: 'text-primary', value: 'var(--neutral-950)' },
      { name: 'text-secondary', value: 'rgb(10 10 10 / .78)' },
      { name: 'text-tertiary', value: 'rgb(10 10 10 / .55)' },
      { name: 'text-disabled', value: 'rgb(10 10 10 / .3)' },
    ],
  },
]

/**
 * Radius, type and spacing, emitted as CSS variables into the FULL bundle
 * (`dist/tokens.css`) alongside the colours. These are the canonical scales the
 * whole estate already ships — the tight app-first type register (base 14px, the
 * linear.app / vercel.com density, not a roomy marketing scale), the 4px spacing
 * hosted. @hanzo/design keeps its own richer typography.css/spacing.css (they
 * carry runtime knobs and breakpoint overrides a flat token cannot); this block
 * is what a bare consumer (@hanzo/brand, a Go surface) needs with nothing to wire.
 */
export const scale: TokenSection[] = [
  {
    title: 'radius',
    vars: [
      { name: 'radius', value: '0.5rem' },
      { name: 'radius-sm', value: '0.375rem', comment: 'rounded-md — buttons, inputs' },
      { name: 'radius-md', value: '0.5rem' },
      { name: 'radius-lg', value: '0.75rem', comment: 'rounded-xl — cards' },
      { name: 'radius-xl', value: '1rem', comment: 'rounded-2xl — dropdown panels' },
      { name: 'radius-2xl', value: '1.5rem', comment: 'rounded-3xl — story / hero cards' },
      { name: 'radius-composer', value: '28px', comment: 'the chat composer, exactly 28px' },
      { name: 'radius-full', value: '9999px', comment: 'pills, CTAs, avatars, badges' },
    ],
  },
  {
    title: 'type — Zen + Zen Mono, self-hosted',
    vars: [
      {
        name: 'font-sans',
        value:
          "'Zen', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      },
      {
        name: 'font-mono',
        value:
          "'Zen Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      },
      { name: 'font-size-xs', value: '0.6875rem', comment: '11px — eyebrows / section labels' },
      { name: 'font-size-sm', value: '0.8125rem', comment: '13px — nav labels, dense body' },
      { name: 'font-size-base', value: '0.875rem', comment: '14px — base app text' },
      { name: 'font-size-lg', value: '0.9375rem', comment: '15px' },
      { name: 'font-size-xl', value: '1.0625rem', comment: '17px' },
      { name: 'font-size-2xl', value: '1.3125rem', comment: '21px' },
      { name: 'font-size-3xl', value: '1.625rem', comment: '26px' },
      { name: 'font-size-4xl', value: '2rem', comment: '32px' },
      { name: 'font-size-5xl', value: '2.5rem', comment: '40px' },
      { name: 'font-size-6xl', value: '3.25rem', comment: '52px' },
      { name: 'font-size-7xl', value: '4rem', comment: '64px' },
      { name: 'font-size-8xl', value: '5.25rem', comment: '84px' },
      { name: 'font-size-9xl', value: '7rem', comment: '112px' },
    ],
  },
  {
    title: 'spacing — the 4px ramp',
    vars: [
      { name: 'space-1', value: '0.25rem' },
      { name: 'space-2', value: '0.5rem' },
      { name: 'space-3', value: '0.75rem' },
      { name: 'space-4', value: '1rem' },
      { name: 'space-5', value: '1.25rem' },
      { name: 'space-6', value: '1.5rem' },
      { name: 'space-8', value: '2rem' },
      { name: 'space-10', value: '2.5rem' },
      { name: 'space-12', value: '3rem' },
      { name: 'space-16', value: '4rem' },
      { name: 'space-20', value: '5rem' },
      { name: 'space-24', value: '6rem' },
    ],
  },
]

/** Flat `{ '--name': 'value' }` maps, first-wins, dark then light overrides. */
function flatten(sections: TokenSection[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const s of sections) for (const v of s.vars) out[`--${v.name}`] = v.value
  return out
}

/** Every dark (`:root`) token, keyed by literal custom-property name. */
export const darkVars = flatten(dark)
/** Every light (`.light`) override, keyed by literal custom-property name. */
export const lightVars = flatten(light)
