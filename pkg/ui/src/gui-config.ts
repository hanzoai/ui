import { defaultConfig } from '@hanzogui/config/v5'
import { createGui } from '@hanzo/gui'

// ─────────────────────────────────────────────────────────────────────────────
// THE ONE SCALE — shared, because a second app that copied it would fork it.
//
// This lived in the console's own gui.config.ts. The moment a second Hanzo admin
// exists (the dedicated Hanzo Social app), a private scale is a scale that drifts:
// the two products would render @hanzo/ui/product components at different sizes,
// radii and spacing. So the scale ships WITH the components.
//
// Three scales used to disagree. `app/design/typography.css` declared the
// intended compact register (11/13/14/15/17/21/26 — the linear.app density);
// @hanzo/gui's Tamagui `$N` ladder is what components actually TYPE (thousands
// of `fontSize="$N"` call sites); and the rendered result was TEN distinct
// sizes, including 217 nodes at the retired 16px base and 30 at 10px, while the
// intended 11px label size rendered NOWHERE.
//
// The ladder is exactly why we do not edit thousands of call sites: REMAP IT
// ONCE and every surface lands on the design scale. So this file is the single
// place the console's type, radius and spacing scales are defined —
// `app/design/*.css` declares them for CSS consumers, this maps the `$N` tokens
// onto the same numbers for the component layer. Change a value here, the whole
// product moves. Adding a fourth spelling of a size is the thing to refuse.
//
// Canonical face: Geist Sans for UI, Geist Mono for anything numeric/code/id
// (`.mono`). The host self-hosts both faces (its own fonts.css) — this only
// names them.
// ─────────────────────────────────────────────────────────────────────────────

const GEIST = "'Geist', system-ui, -apple-system, sans-serif"

/** The numeric/code/id face. Byte-for-byte the stack `.mono` sets in
 *  styles/motion.css — the class and the `$mono` token have to resolve to the
 *  same face or the same number renders in two different fonts depending on
 *  which one a component reached for. */
const GEIST_MONO = "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"

/** Type — the same SIX sizes, now DEFERRED to @hanzo/design rather than restated.
 *  $1 label · $2 nav + dense body · $3 base · $4/$5 emphasis · $6 section head ·
 *  $7 page title · $8+ display. `$5` still collapses onto 15 to retire the 16px
 *  base (217 stray nodes); `$9` still collapses onto 26 so a page title has ONE
 *  size — those are decisions, and deferring the VALUE does not undo them.
 *
 *  Twelve rungs name a design token whose published value is byte-identical to
 *  the number that was here, so this is a zero-change edit; gui-config.test.ts
 *  asserts that equality rung by rung, the same way it already does for the
 *  three colour rungs, so design cannot move a size without this failing.
 *
 *  Four rungs ($12 48 · $13 56 · $15 80 · $16 96) have no counterpart: design's
 *  display ramp goes 52/64/84/112. Inventing a token or silently resizing them
 *  would both be worse than saying so, so they keep their literal and carry the
 *  knob directly.
 *
 *  Why a var() at all: gui resolves these in JS and applies them INLINE, and an
 *  inline style outranks every stylesheet — so a CSS custom property is the only
 *  thing that can reach a `fontSize="$n"` call site, and there are ~1600 of them.
 *  design's ramp multiplies by `--type-scale`, so one number retunes the whole
 *  product and a person can set it for themselves. The px literal stays as the
 *  var()'s fallback, so a host that mounts no token layer still renders. */
const FONT_SIZE = {
  1: `var(--text-xs, 11px)`,
  2: `var(--text-sm, 13px)`,
  3: `var(--text-base, 14px)`,
  4: `var(--text-lg, 15px)`,
  5: `var(--text-lg, 15px)`,
  6: `var(--text-xl, 17px)`,
  7: `var(--text-2xl, 21px)`,
  8: `var(--text-3xl, 26px)`,
  9: `var(--text-3xl, 26px)`,
  10: `var(--text-4xl, 32px)`,
  11: `var(--text-5xl, 40px)`,
  12: `calc(48px * var(--type-scale, 1))`,
  13: `calc(56px * var(--type-scale, 1))`,
  14: `var(--text-7xl, 64px)`,
  15: `calc(80px * var(--type-scale, 1))`,
  16: `calc(96px * var(--type-scale, 1))`,
  true: `var(--text-base, 14px)`,
} as const

/** Leading, paired 1:1 with the sizes above — and NOT deferred, deliberately.
 *  design publishes its own `--leading-*` rhythm and exactly ONE of these
 *  sixteen matches it, so adopting those would re-flow every line box in the
 *  product. These are the values tuned for this ladder; they keep them, and
 *  carry `--type-scale` so leading grows with the text instead of clamping it. */
const LINE_HEIGHT = {
  1: `calc(16px * var(--type-scale, 1))`,
  2: `calc(18px * var(--type-scale, 1))`,
  3: `calc(20px * var(--type-scale, 1))`,
  4: `calc(22px * var(--type-scale, 1))`,
  5: `calc(22px * var(--type-scale, 1))`,
  6: `calc(24px * var(--type-scale, 1))`,
  7: `calc(28px * var(--type-scale, 1))`,
  8: `calc(32px * var(--type-scale, 1))`,
  9: `calc(32px * var(--type-scale, 1))`,
  10: `calc(38px * var(--type-scale, 1))`,
  11: `calc(46px * var(--type-scale, 1))`,
  12: `calc(54px * var(--type-scale, 1))`,
  13: `calc(62px * var(--type-scale, 1))`,
  14: `calc(70px * var(--type-scale, 1))`,
  15: `calc(86px * var(--type-scale, 1))`,
  16: `calc(102px * var(--type-scale, 1))`,
  true: `calc(20px * var(--type-scale, 1))`,
} as const

/** Radius — FOUR values, no more. 6 control · 8 input/row · 12 panel · pill.
 *  The inherited ladder had thirteen spellings rendering ten values, including
 *  three different spellings of "pill" (`{999}`, `{99}`, `$10`). `$10`+ IS the
 *  pill, so the 115 `rounded="$10"` call sites finally mean one thing. */
const RADIUS = {
  0: 0,
  1: 6,
  2: 6,
  3: 8,
  4: 8,
  5: 12,
  6: 12,
  7: 12,
  8: 12,
  9: 12,
  10: 9999,
  11: 9999,
  12: 9999,
  true: 8,
} as const

/** Spacing — the 4px ramp, and only the 4px ramp. The inherited ladder landed on
 *  odd pixels belonging to no scale: `$2`=7, `$3`=13, `$4`=18 were the three
 *  most-rendered paddings in the whole app. Mirrored into negative steps because
 *  Tamagui resolves `-$3` from this same map. */
const STEP: Record<string, number> = {
  '0': 0,
  '0.25': 1,
  '0.5': 2,
  '0.75': 3,
  '1': 4,
  '1.5': 6,
  '2': 8,
  '2.5': 10,
  '3': 12,
  '3.5': 14,
  '4': 16,
  '4.5': 20,
  '5': 24,
  '6': 32,
  '7': 40,
  '8': 48,
  '9': 56,
  '10': 64,
  '11': 80,
  '12': 96,
  '13': 112,
  '14': 128,
  '15': 144,
  '16': 160,
  '17': 160,
  '18': 176,
  '19': 192,
  '20': 208,
}

const space: Record<string, number> = {}
for (const [k, v] of Object.entries(STEP)) {
  space[`$${k}`] = v
  space[`-${k}`] = -v
}
space.$true = STEP['4']
space['-true'] = -STEP['4']

/**
 * THREE RUNGS OF THE NUMBERED RAMP UNDID A TOKEN DECISION, so they are re-based.
 *
 * `$color1..$color12` is a generic monotonic ramp inherited from upstream
 * `@hanzogui/themes` — a scale, not this system's token layer. Most of it is
 * harmless: a ramp of greys is a ramp of greys. Three rungs are not, because
 * every component in this package reads them by name and @hanzo/design had
 * already decided each one the other way, in writing:
 *
 *   `$borderColor` (= `$color4`) shipped `hsla(0, 0%, 14%, 1)` — a SOLID edge.
 *   design's `colors.css` spends a paragraph on why its borders are alpha: a
 *   solid hex hairline vanishes the moment it lands on a lifted surface,
 *   because it stops being a lighter line and becomes an unrelated grey. Nearly
 *   every component here (Button, Input, Card, Select, Dialog, Popover,
 *   Tooltip, Switch, Checkbox, DropdownMenu) draws its edge with it.
 *
 *   `$color12` shipped `hsla(0, 0%, 100%, 1)` — PURE WHITE, and it is the label
 *   colour for Button's default/primary, for every Badge, and for the `accent`
 *   recipe, the one loud control a page is allowed. design sets `--foreground`
 *   to `#fafafa` on purpose: pure white halates on near-black.
 *
 *   `$outlineColor` shipped `hsla(0, 0%, 27%, 0.6)` — the FOCUS RING, and on a
 *   near-black ground that composites to about `rgb(45,45,45)`, roughly 1.2:1
 *   against the header it is drawn on. WCAG 2.4.11 asks for 3:1. Measured on
 *   hanzo.app's Sign In, Get started and Search — the three primary CTAs, where
 *   a keyboard user has no other way to know where they are. design publishes
 *   `--ring` at `rgb(255 255 255 / .40)` for exactly this, translucent so it
 *   lifts with whatever surface is under it; over the header that lands near
 *   3.6:1. A ring is not a shade of grey somebody picked, it is a contrast
 *   requirement, and the ramp had no way to know that.
 *
 * So the three rungs read the token instead of shadowing it. `var()` first, so a
 * host that mounts design's sheet (this package's own theme.css does) follows
 * the live cascade and inverts with it; design's published literal behind it,
 * so a host that mounts neither still gets the right value rather than a
 * dropped declaration.
 *
 * The literals are stated per theme rather than left to the cascade, and that
 * is load-bearing: a NESTED `<Theme name="light">` (PrimaryButton's white pill
 * inside a dark app) emits `.t_light` on a span, not on `:root`, so the light
 * column has to be able to answer on its own. gui-config.test.ts reads
 * @hanzo/design's stylesheet and fails if either column stops matching what
 * design publishes, so the copy cannot drift.
 */
const EDGE = { dark: 'rgb(255 255 255 / .10)', light: 'rgb(0 0 0 / .10)' } as const
const LABEL = { dark: '#fafafa', light: '#0a0a0a' } as const
const RING = { dark: 'rgb(255 255 255 / .40)', light: 'rgb(0 0 0 / .5)' } as const

/**
 * The edge and the label are re-based on the two ROOT themes; the ring is
 * re-based on ALL of them, and the asymmetry is the point.
 *
 * A sub-theme exists to hold different colours — `dark_accent`'s label really
 * should be the accent's label, `dark_red`'s edge really should be red — so
 * re-basing those two rungs everywhere would flatten 388 themes into one and
 * stop being a re-base. A focus ring is the opposite kind of thing: there is
 * exactly ONE of it in this system, it is `--ring`, and it is a contrast
 * requirement rather than a colour choice. The ramp ships 21 distinct rings
 * across 390 themes, twenty of them hues — a pale blue on `dark_blue_Button`,
 * a pale pink on `dark_pink` — and every one of them fails 3:1 on a near-black
 * canvas the same way the grey did.
 *
 * Measured, and this is why the two root themes are not enough: gui activates a
 * `Button` sub-theme for every Button it renders, so hanzo.app's Sign In, Get
 * started and Search kept `dark_Button`'s ring at 1.4:1 while the page's own
 * `--outlineColor` already read design's. The three CTAs the audit named were
 * exactly the three a root-only fix misses.
 */
const scheme = (name: string): 'dark' | 'light' => (name.startsWith('light') ? 'light' : 'dark')

const themes = Object.fromEntries(
  Object.entries(defaultConfig.themes).map(([name, theme]) => {
    const s = scheme(name)
    const ringed = { ...theme, outlineColor: `var(--ring, ${RING[s]})` }
    return [
      name,
      name === s
        ? {
            ...ringed,
            color4: `var(--border, ${EDGE[s]})`,
            borderColor: `var(--border, ${EDGE[s]})`,
            color12: `var(--foreground, ${LABEL[s]})`,
          }
        : ringed,
    ]
  }),
) as typeof defaultConfig.themes

// Everything except the theme table, which is the one thing the two configs
// below disagree about. Stated once so they cannot drift on radius or fonts.
const base = {
  ...defaultConfig,
  tokens: {
    ...defaultConfig.tokens,
    radius: RADIUS,
    space,
  },
  fonts: {
    ...defaultConfig.fonts,
    body: { ...defaultConfig.fonts.body, family: GEIST, size: FONT_SIZE, lineHeight: LINE_HEIGHT },
    heading: { ...defaultConfig.fonts.heading, family: GEIST, size: FONT_SIZE, lineHeight: LINE_HEIGHT },
    // `$mono` was NOT defined here, and gui emits NO class for a font token it
    // does not know — no warning, no fallback, a green build and text that is
    // simply not monospace. 260 `fontFamily="$mono"` call sites across 74 files
    // in hanzo.app were dead on that alone. A missing token has to be a defined
    // token, not a silent no-op, so it is defined.
    mono: { ...defaultConfig.fonts.body, family: GEIST_MONO, size: FONT_SIZE, lineHeight: LINE_HEIGHT },
  },
}

export const config = createGui({ ...base, themes })

export default config

/**
 * The eight chromatic families. Everything else a sub-theme name can carry —
 * `accent`, `black`, `white`, `gray`, `neutral`, `surface1`, `surface2` — is a
 * position on the greyscale, so it survives into the monochrome table below.
 *
 * Derived from the segment, never from a substring: `dark_teal_Button` is
 * chromatic because one of its segments IS `teal`, while a future
 * `dark_tealish` or a component called `Red` is not caught by accident.
 */
const CHROMA = new Set(['blue', 'green', 'orange', 'pink', 'purple', 'red', 'teal', 'yellow'])

const chromatic = (name: string) => name.split('_').slice(1).some((s) => CHROMA.has(s))

/**
 * The same system with the chromatic sub-themes omitted — 150 themes instead of
 * 390, and 62% less theme table.
 *
 * A gui theme table is DATA that ships: it cannot be tree-shaken, because a
 * theme is selected by string at runtime. So a surface that renders no colour
 * still pays for every hue. The browser extension's new-tab page is monochrome
 * by design and loads on every single tab, and 240 themes it can never activate
 * were the difference between it fitting its bundle budget and not.
 *
 * This is NOT a second design system. It is the same `config` with rows
 * removed, from the same scale, so nothing here can drift from `config` — only
 * be absent from it. Reach for it when a surface genuinely renders no hue;
 * anything that does must use `config`, because a missing theme falls back
 * silently rather than failing.
 */
export const monochrome = createGui({
  ...base,
  themes: Object.fromEntries(
    Object.entries(themes).filter(([name]) => !chromatic(name)),
  ) as typeof themes,
})

export type Conf = typeof config
