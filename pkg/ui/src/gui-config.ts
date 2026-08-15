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

/**
 * Every step carries `--density`, the same way every type rung carries
 * `--type-scale`.
 *
 * Spacing is the axis a density control actually moves — design's own
 * `tokens/spacing.css` multiplies each `--space-*` by `var(--density, 1)`, but
 * that reaches only CSS consumers. gui resolves `padding="$4"` in JS and writes
 * it into an atomic class as `var(--c-space-4)`, so the ramp gui compiles is a
 * SECOND ramp, and until it carried the knob a density preference moved the
 * stylesheet and left every gui-rendered gap exactly where it was.
 *
 * The px literal stays the source of truth and stays visible in the number
 * above; `calc()` multiplies it. At density 1 that is a byte-for-byte no-op —
 * `calc(16px * 1)` computes to `16px` — so this changes nothing until somebody
 * asks it to.
 *
 * Zero is left as the number `0`: `calc(0px * n)` is still zero, and a token
 * whose whole meaning is "no space" does not need a knob to say so.
 */
const step = (px: number): string | number => (px === 0 ? 0 : `calc(${px}px * var(--density, 1))`)

const space: Record<string, string | number> = {}
for (const [k, v] of Object.entries(STEP)) {
  space[`$${k}`] = step(v)
  space[`-${k}`] = step(-v)
}
space.$true = step(STEP['4'])
space['-true'] = step(-STEP['4'])

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
 * The ground, the placeholder, and the one loud fill — the rest of what a brand
 * owns, on the same terms as the three rungs above.
 *
 * `color`, `placeholderColor` and the accent pair are plain references, because
 * design spells them `--foreground`, `--text-tertiary`, `--primary` and
 * `--primary-foreground` while gui's keys are `color`, `placeholderColor`,
 * `accentBackground` and `accentColor`. Those names never meet, so the reference
 * is live and that is the end of it.
 *
 * `background` is the ONE name that cannot be referenced, and it is worth being
 * exact about why. gui publishes each THEME key as a bare `--<key>` on
 * `:root.t_dark` — specificity (0,2,0) against design's (0,1,0) `:root` — so
 * gui's copy wins for the whole document, not merely for gui's own components.
 * Point it back at the name it shadows and `--background: var(--background)` is
 * a self-reference; CSS drops BOTH sides of a cycle and the property computes
 * EMPTY. Not theory: an empty `--border` is what left `border-border` falling
 * back to `currentColor`, a white hairline on every pricing card on hanzo.ai.
 *
 * Three things that look like fixes are not, each measured in a browser:
 *   · a fallback — `var(--background, #0a0a0a)` computes empty too, because the
 *     fallback is inside the dependency graph the cycle is found in;
 *   · routing through design's `--surface-page`, which is itself declared as
 *     `var(--background)` — a two-hop cycle, equally empty;
 *   · deleting the key here, which stops `$background` resolving at all and so
 *     emits no class rather than the wrong one.
 *
 * So the value stays design's published literal — `gui-config.test.ts` reads it
 * out of design's own stylesheet, so it cannot drift — and the DECLARATION is
 * dropped from the root theme blocks by `css()` below. The literal never reaches
 * a browser; `var(--background)` resolves through design, live and rebrandable.
 * Keeping a true literal rather than a reference is deliberate: if a consumer
 * ever emits this sheet without `css()`, it renders design's colour frozen
 * instead of rendering nothing, and a frozen ground is a far cheaper failure
 * than an empty one.
 *
 * `accentBackground`/`accentColor` are gui's loud control pair, and design's
 * `--primary`/`--primary-foreground` are the same idea under this system's own
 * name. Binding them is what puts an ACCENT within reach: `@hanzo/appearance`
 * writes `--primary` (and `--accent`) for a person, `themeToTokens()` writes the
 * same names for an org, and both now land on the same components. Before this
 * the accent knob reached nothing gui rendered — nothing in this package
 * referenced `--primary` at all.
 */
const GROUND = { dark: '#0a0a0a', light: '#f7f7f7' } as const
const MUTED = { dark: 'rgb(255 255 255 / .55)', light: 'rgb(10 10 10 / .55)' } as const
const LOUD = { dark: '#fafafa', light: '#0a0a0a' } as const
const LOUD_LABEL = { dark: '#0a0a0a', light: '#fafafa' } as const

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
            background: GROUND[s],
            color: `var(--foreground, ${LABEL[s]})`,
            placeholderColor: `var(--text-tertiary, ${MUTED[s]})`,
            accentBackground: `var(--primary, ${LOUD[s]})`,
            accentColor: `var(--primary-foreground, ${LOUD_LABEL[s]})`,
          }
        : ringed,
    ]
  }),
) as typeof defaultConfig.themes

// Everything except the theme table, which is the one thing the two configs
// below disagree about. Stated once so they cannot drift on radius or fonts.
/**
 * gui types a font size as a NUMBER, and at runtime it is a CSS value.
 *
 * The token table is handed straight through to the style layer — verified by
 * reading the built config, where `config.fonts.body.size['3']` is the string
 * `var(--text-base, 14px)` — which is exactly how the three colour rungs above
 * already carry `var(--border, …)`. Colour is typed loosely enough to allow it;
 * size is not, so upstream's type is narrower than upstream's behaviour.
 *
 * Asserting here rather than widening the tokens keeps the lie in ONE place,
 * next to the reason for it, instead of letting `any` spread through the config.
 */
const asSizes = <T,>(t: T) => t as unknown as typeof defaultConfig.fonts.body.size

/**
 * ONE authority decides the theme, and it is the class on `<html>`.
 *
 * gui's default wraps each theme's root variables in
 * `@media (prefers-color-scheme: …)`, which asks the OS a question every Hanzo
 * surface has already answered: @hanzo/design is dark-first at bare `:root` and
 * retunes under `.light`, and gui itself stamps `.t_dark` / `.t_light` on the
 * html element. Two authorities for one question disagree exactly when they are
 * least visible — a light-scheme browser opening a dark product — and the media
 * block outranks nothing and everything at once, because it TIES design on
 * specificity and wins on load order.
 *
 * Both consumers had already discovered this and answered it privately, at the
 * wrong layer: hanzo.ai set this same flag in a config of its own, and
 * hanzo.app's sheet generator unwrapped the dark block and deleted the light one
 * after the fact. A generated sheet edited afterwards is a fact stated twice, so
 * it is stated here instead, once, where both read it.
 */
const base = {
  ...defaultConfig,
  settings: { ...defaultConfig.settings, shouldAddPrefersColorThemes: false },
  tokens: {
    ...defaultConfig.tokens,
    radius: RADIUS,
    space,
  },
  fonts: {
    ...defaultConfig.fonts,
    body: { ...defaultConfig.fonts.body, family: GEIST, size: asSizes(FONT_SIZE), lineHeight: asSizes(LINE_HEIGHT) },
    heading: { ...defaultConfig.fonts.heading, family: GEIST, size: asSizes(FONT_SIZE), lineHeight: asSizes(LINE_HEIGHT) },
    // `$mono` was NOT defined here, and gui emits NO class for a font token it
    // does not know — no warning, no fallback, a green build and text that is
    // simply not monospace. 260 `fontFamily="$mono"` call sites across 74 files
    // in hanzo.app were dead on that alone. A missing token has to be a defined
    // token, not a silent no-op, so it is defined.
    mono: { ...defaultConfig.fonts.body, family: GEIST_MONO, size: asSizes(FONT_SIZE), lineHeight: asSizes(LINE_HEIGHT) },
  },
}

export const config = createGui({ ...base, themes })

export default config

/**
 * The three names design owns that gui also publishes as theme keys.
 *
 * `background` is the ground; `black` and `white` are constants, and they are
 * not harmless — design publishes `--white: #fafafa` in dark because pure white
 * halates on near-black, and gui's ramp overwrites it with `#ffffff`. That is
 * design's own decision being undone by a name collision.
 */
const OWNED = ['background', 'black', 'white']

/** Exactly `:root`, `:root.t_dark` or `:root.t_light` — a ROOT theme. Anything
 *  carrying a further `.t_*` is a NESTED theme, and a nested theme scoping its
 *  own ground is what a nested theme IS. ~248 of them legitimately do. */
const ROOT_THEME = /^:root(\.t_(dark|light))?$/

/**
 * gui's stylesheet, with the declarations that shadow @hanzo/design removed.
 *
 * THIS is what a consumer emits — never `config.getCSS()` directly. gui builds
 * its atomic CSS as components render, so every app runs a generator of its own;
 * that is why this cannot be a step inside one package's build script and has to
 * be the function apps call. It was one, in `scripts/gen-css.mjs`, and it
 * therefore fixed @hanzo/ui's own sheet and nothing else — hanzo.ai generates
 * its sheet with its own script and still ships gui's grey over design's black.
 *
 * gui shadows TWICE, by two different mechanisms, and fixing one leaves the page
 * just as wrong:
 *   · `:root.t_dark` / `:root.t_light` — (0,2,0), beats design on SPECIFICITY,
 *     so re-importing design's colours last cannot win. That workaround only
 *     appears to work where the theme class never reaches <html>, and reverts
 *     the day someone wires themes properly — a fix that expires on being fixed.
 *   · plain `:root { --background: … }` — (0,1,0), TIES design and wins on
 *     SOURCE ORDER, because gui's block is appended after design's.
 *
 * Removing the declaration does not remove the token: `$background` still
 * resolves to `var(--background)` and still emits its class, and that `var()`
 * now reads design's value from the cascade. So the ground follows the brand,
 * the theme and any runtime retune, which is the whole point.
 *
 * It takes the table it emits, because a surface may mount `monochrome` instead
 * (below) and would otherwise ship the full sheet beside the reduced runtime —
 * 390 themes of CSS for a config that can activate 150. One emitter, either
 * table; the prune is the same either way, because the shadowing is a property
 * of gui and not of which rows are in the table.
 */
export function css(conf: { getCSS(): string } = config): string {
  const source = conf.getCSS()
  let out = ''
  let i = 0
  while (i < source.length) {
    const open = source.indexOf('{', i)
    if (open === -1) { out += source.slice(i); break }
    const close = source.indexOf('}', open)
    if (close === -1) { out += source.slice(i); break }
    const selector = source.slice(i, open)
    let body = source.slice(open + 1, close)
    if (selector.split(',').some((s) => ROOT_THEME.test(s.trim()))) {
      for (const name of OWNED) {
        body = body.replace(new RegExp(`(^|;)\\s*--${name}\\s*:[^;}]*;?`, 'g'), '$1')
      }
    }
    out += selector + '{' + body + '}'
    i = close + 1
  }
  return out
}

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
