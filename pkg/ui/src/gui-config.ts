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

/** Type — SIX sizes in the app, matching the host's `--text-*` design tokens.
 *  $1 label · $2 nav + dense body · $3 base · $4/$5 emphasis · $6 section head ·
 *  $7 page title · $8+ display. `$5` collapses onto 15 to retire the 16px base
 *  (217 stray nodes); `$9` collapses onto 26 so a page title has ONE size. */
const FONT_SIZE = {
  1: 11,
  2: 13,
  3: 14,
  4: 15,
  5: 15,
  6: 17,
  7: 21,
  8: 26,
  9: 26,
  10: 32,
  11: 40,
  12: 48,
  13: 56,
  14: 64,
  15: 80,
  16: 96,
  true: 14,
} as const

/** Leading, paired 1:1 with the sizes above. A size token carries a line-height
 *  tuned for ONE line, so these track the type scale rather than the inherited
 *  ladder, which left an 11px label sitting in an 18px box. */
const LINE_HEIGHT = {
  1: 16,
  2: 18,
  3: 20,
  4: 22,
  5: 22,
  6: 24,
  7: 28,
  8: 32,
  9: 32,
  10: 38,
  11: 46,
  12: 54,
  13: 62,
  14: 70,
  15: 86,
  16: 102,
  true: 20,
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
 * TWO RUNGS OF THE NUMBERED RAMP UNDID A TOKEN DECISION, so they are re-based.
 *
 * `$color1..$color12` is a generic monotonic ramp inherited from upstream
 * `@hanzogui/themes` — a scale, not this system's token layer. Most of it is
 * harmless: a ramp of greys is a ramp of greys. Two rungs are not, because
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
 * So the two rungs read the token instead of shadowing it. `var()` first, so a
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

const rebased = (theme: 'dark' | 'light') => ({
  ...defaultConfig.themes[theme],
  color4: `var(--border, ${EDGE[theme]})`,
  borderColor: `var(--border, ${EDGE[theme]})`,
  color12: `var(--foreground, ${LABEL[theme]})`,
})

export const config = createGui({
  ...defaultConfig,
  themes: {
    ...defaultConfig.themes,
    dark: rebased('dark'),
    light: rebased('light'),
  },
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
})

export default config

export type Conf = typeof config
