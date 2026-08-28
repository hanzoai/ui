/**
 * A utility class and a gui style prop are two notations for one value: `px-4`
 * and `px={16}` say the same thing. This is the function between them.
 *
 * It exists so an app carrying a hundred thousand utility classes can render
 * through gui without either rewriting every class first or keeping a second
 * styling engine around to read them. Convert the notation, delete the engine.
 *
 * Values are CONCRETE — `p-4` is 16, not `$4`. The token scale is where these
 * apps are going, but a token substitution moves every measurement on the page
 * at the same time as the engine underneath it changes, and then nothing
 * identifies which of the two moved it. Retheming is its own step.
 *
 * A class this does not know is returned in `rest`, never dropped. A caller
 * passes it through as a class name, so an unconverted page degrades to what it
 * does today rather than to an unstyled one.
 */

import { flatten, type ClassValue } from './core/cn'

export type Props = Record<string, unknown>

/** Recognized props, plus the classes that stay class names. */
export type Parsed = { props: Props; rest: string }

/** Tailwind's 4px ramp, and the three fractional stops below it. */
const SPACE: Record<string, number> = {
  '0': 0, px: 1, '0.5': 2, '1': 4, '1.5': 6, '2': 8, '2.5': 10, '3': 12,
  '3.5': 14, '4': 16, '5': 20, '6': 24, '7': 28, '8': 32, '9': 36, '10': 40,
  '11': 44, '12': 48, '14': 56, '16': 64, '20': 80, '24': 96, '28': 112,
  '32': 128, '36': 144, '40': 160, '44': 176, '48': 192, '52': 208, '56': 224,
  '60': 240, '64': 256, '72': 288, '80': 320, '96': 384,
}

/**
 * A size is the theme's variable, not a hardcoded pixel — the same reason a
 * colour is. Tailwind reads `--text-*` from the theme too, and a design system
 * may set its own ramp: @hanzo/design's is compact, where `base` is 14px and
 * `sm` is 13px. Baking Tailwind's stock 16/14 in made every converted size
 * wrong for those apps, which measured as a page silently shrinking.
 */
const FONT_SIZE: Record<string, string> = Object.fromEntries(
  ['xs','sm','base','lg','xl','2xl','3xl','4xl','5xl','6xl','7xl','8xl','9xl']
    .map((k) => [k, `var(--text-${k})`]),
)

const WEIGHT: Record<string, number> = {
  thin: 100, extralight: 200, light: 300, normal: 400, medium: 500,
  semibold: 600, bold: 700, extrabold: 800, black: 900,
}

/**
 * A corner is the theme's variable, for the same reason a size is. @hanzo/design
 * states the ramp — 6/8/12/16/24 — and Tailwind reads the same `--radius-*`
 * names, so a class and a converted prop paint the same corner. Baking
 * Tailwind's stock numbers in put every converted corner one rung small.
 */
const RADIUS: Record<string, number | string> = {
  none: 0,
  sm: 'var(--radius-sm, 0.375rem)',
  '': 4,
  md: 'var(--radius-md, 0.5rem)',
  lg: 'var(--radius-lg, 0.75rem)',
  xl: 'var(--radius-xl, 1rem)',
  '2xl': 'var(--radius-2xl, 1.5rem)',
  '3xl': 'var(--radius-3xl, 1.5rem)',
  full: 9999,
}

const LEADING: Record<string, string> = {
  none: '1', tight: '1.25', snug: '1.375', normal: '1.5', relaxed: '1.625', loose: '2',
}

const TRACKING: Record<string, number> = {
  tighter: -0.8, tight: -0.4, normal: 0, wide: 0.4, wider: 0.8, widest: 1.6,
}

/** Flex words Tailwind and the style property spell differently. */
const ALIGN: Record<string, string> = {
  start: 'flex-start', end: 'flex-end', center: 'center',
  between: 'space-between', around: 'space-around', evenly: 'space-evenly',
  stretch: 'stretch', baseline: 'baseline',
}

const SIDE: Record<string, string> = { t: 'Top', r: 'Right', b: 'Bottom', l: 'Left' }

/** Longest first, so `max-w` wins over `max` and `gap-x` over `gap`. */
const HEADS = [
  'min-w', 'min-h', 'max-w', 'max-h', 'grid-cols', 'grid-rows', 'col-span',
  'auto-cols', 'auto-rows', 'grid-flow', 'col-start', 'col-end', 'row-start', 'row-end',
  'place-items', 'place-content', 'place-self', 'justify-items', 'justify-self',
  'row-span', 'translate-x', 'translate-y', 'gap-x', 'gap-y', 'space-x', 'space-y', 'overflow-x', 'overflow-y',
  'transition', 'duration', 'delay', 'ease', 'blur', 'backdrop-blur', 'shadow',
  'underline-offset',
  'cursor', 'overflow',
  'tracking', 'leading', 'rounded', 'border', 'divide', 'aspect', 'object',
  'whitespace', 'align', 'inset', 'inset-x', 'inset-y', 'items', 'justify', 'content', 'self',
  'opacity', 'text', 'font', 'bg', 'gap', 'space-x', 'space-y', 'top', 'right', 'bottom', 'left',
  'w', 'h', 'z', 'p', 'px', 'py', 'pt', 'pr', 'pb', 'pl',
  'm', 'mx', 'my', 'mt', 'mr', 'mb', 'ml',
].sort((a, b) => b.length - a.length)

/** Tailwind names the gradient's destination; CSS names its angle. */
const DIRECTION: Record<string, string> = {
  t: 'to top', tr: 'to top right', r: 'to right', br: 'to bottom right',
  b: 'to bottom', bl: 'to bottom left', l: 'to left', tl: 'to top left',
}

const FAMILY: Record<string, string> = {
  sans: 'var(--font-sans)', serif: 'var(--font-serif)', mono: 'var(--font-mono)',
}

const DURATION: Record<string, number> = {
  '0': 0, '75': 75, '100': 100, '150': 150, '200': 200, '300': 300,
  '500': 500, '700': 700, '1000': 1000,
}

/** What Tailwind animates under each word. */
const TRANSITION: Record<string, string> = {
  none: 'none', all: 'all', DEFAULT: 'color, background-color, border-color, opacity, box-shadow, transform',
  colors: 'color, background-color, border-color, text-decoration-color, fill, stroke',
  opacity: 'opacity',
  shadow: 'box-shadow', transform: 'transform',
}

const SHADOW: Record<string, string> = {
  none: 'none', sm: '0 1px 2px rgb(0 0 0 / .05)',
  DEFAULT: '0 1px 3px rgb(0 0 0 / .1), 0 1px 2px rgb(0 0 0 / .06)',
  md: '0 4px 6px rgb(0 0 0 / .1), 0 2px 4px rgb(0 0 0 / .06)',
  lg: '0 10px 15px rgb(0 0 0 / .1), 0 4px 6px rgb(0 0 0 / .05)',
  xl: '0 20px 25px rgb(0 0 0 / .1), 0 10px 10px rgb(0 0 0 / .04)',
  '2xl': '0 25px 50px rgb(0 0 0 / .25)', inner: 'inset 0 2px 4px rgb(0 0 0 / .06)',
}

const BLUR: Record<string, number> = {
  none: 0, xs: 4, sm: 8, DEFAULT: 8, md: 12, lg: 16, xl: 24, '2xl': 40, '3xl': 64,
}

/** How an implicit grid track is sized. */
const AUTO: Record<string, string> = {
  auto: 'auto', min: 'min-content', max: 'max-content', fr: 'minmax(0, 1fr)',
}

/** A named implicit track, or an arbitrary one written in brackets. */
const auto = (v: string): string | null => {
  const arb = /^\[(.+)]$/.exec(v)
  return arb ? arb[1] : (AUTO[v] ?? null)
}

const FLOW: Record<string, string> = {
  row: 'row', col: 'column', dense: 'dense',
  'row-dense': 'row dense', 'col-dense': 'column dense',
}

/**
 * A track list: a count of equal tracks, an explicit list, or none.
 *
 * Tailwind writes an arbitrary list with underscores because a class name
 * cannot hold a space — `grid-cols-[1fr_auto]` is `1fr auto`. An escaped
 * underscore (`\_`) is a literal one, which matters inside a `minmax()` or a
 * custom property name.
 */
/** Inside a bracket an `_` stands for a space; `\_` is a literal underscore. */
const unscore = (s: string) => s.replace(/\\_/g, '\u0000').replace(/_/g, ' ').replace(/\u0000/g, '_')

function track(v: string, prop: string): Props | null {
  if (v === 'none') return { [prop]: 'none' }
  if (/^\d+$/.test(v)) return { [prop]: `repeat(${v}, minmax(0, 1fr))` }
  const arb = /^\[(.+)]$/.exec(v)
  if (!arb) return null
  return { [prop]: unscore(arb[1]) }
}

/** A grid LINE — a number, a negative number counting from the end, or auto. */
function line(v: string, prop: string): Props | null {
  if (v === 'auto') return { [prop]: 'auto' }
  return /^-?\d+$/.test(v) ? { [prop]: +v } : null
}

/**
 * An arbitrary value, made valid.
 *
 * `calc()` REQUIRES whitespace around `+` and `-`; without it the whole
 * declaration is a parse error and the browser drops it. A class cannot hold a
 * space, so `pt-[calc(44px+4vh)]` is what an author writes and
 * `padding-top: calc(44px+4vh)` is what it becomes — silently nothing.
 * Measured: it left the lux hero with no top padding at all, tucked under a
 * fixed 80px header.
 *
 * `*` and `/` do not need the space and are left alone. A `-` is only an
 * operator between two values — never inside `var(--name)`, and never leading
 * a negative number — which is what the lookaround checks.
 */
const operable = (s: string): string =>
  s.includes('calc(')
    ? s.replace(/(?<=[\w%)])\s*\+\s*/g, ' + ').replace(/(?<=[\w%)])\s*-\s*(?=[\d.(])/g, ' - ')
    : s

/** A size word, a fraction, or a step on the ramp. */
function size(v: string): string | number | undefined {
  if (v === 'full') return '100%'
  if (v === 'screen') return '100vh'
  if (v === 'auto' || v === 'fit' || v === 'min' || v === 'max') return v === 'fit' ? 'fit-content' : v
  if (v in SPACE) return SPACE[v]
  const frac = /^(\d+)\/(\d+)$/.exec(v)
  if (frac) return `${((+frac[1] / +frac[2]) * 100).toFixed(4).replace(/\.?0+$/, '')}%`
  const arb = /^\[(.+)]$/.exec(v)
  if (arb) return operable(unscore(arb[1]))
  return undefined
}

/**
 * A colour is a CSS custom property, so `text-foreground` stays exactly the
 * value the sheet already resolves — the palette is not restated here. The
 * `/NN` suffix is an alpha, which `color-mix` applies without needing to know
 * what the variable holds. Tailwind writes that alpha two ways — `/5` as a
 * percentage and `/[0.05]` as the same fraction — and reading only the first
 * left the second inside the NAME, so `bg-white/[0.02]` asked the sheet for a
 * variable called `--white/[0.02]` and painted nothing.
 */
function color(v: string): string | undefined {
  if (v === 'transparent') return 'transparent'
  if (v === 'current') return 'currentColor'
  if (v === 'white') return '#fff'
  if (v === 'black') return '#000'
  const m = /^(.+?)(?:\/(\[[\d.]+]|\d{1,3}))?$/.exec(v)
  if (!m) return undefined
  const [, name, alpha] = m
  const arb = /^\[(.+)]$/.exec(name)
  const base = arb ? arb[1]
    : name === 'white' ? '#fff' : name === 'black' ? '#000'
    : `var(--${name})`
  if (!alpha) return base
  const pct = alpha[0] === '[' ? +(+alpha.slice(1, -1) * 100).toFixed(4) : +alpha
  return `color-mix(in srgb, ${base} ${pct}%, transparent)`
}

/** Properties a negative class may set — the rest have no negative form. */
const NEGATABLE = /^(margin|top|right|bottom|left|zIndex|translate)/

/** A transform function and its value: `translateX(50%)` -> `translateX`, `50`, `%`. */
const TRANSFORM_FN = /^([a-z]+)\((-?[\d.]+)([a-z%]*)\)$/i

/** One class to zero or more props. Returns null when the class is unknown. */
function one(c: string): Props | null {
  // display and the flex words
  switch (c) {
    case 'flex': return { display: 'flex', flexDirection: 'row' }
    case 'inline-flex': return { display: 'inline-flex', flexDirection: 'row' }
    case 'grid': return { display: 'grid' }
    // A grid that sits in a line of text, sized to its content — the grid
    // counterpart of `inline-flex`, and the shape a row of buttons wants.
    case 'inline-grid': return { display: 'inline-grid' }
    case 'block': return { display: 'block' }
    case 'inline': return { display: 'inline' }
    case 'inline-block': return { display: 'inline-block' }
    case 'hidden': return { display: 'none' }
    // `invisible` keeps the box and hides what is in it, which is what a spacer
    // wants — `hidden` above would collapse the very space it exists to take.
    //
    // Rendered as opacity rather than `visibility`, which the native target has
    // no equivalent for. The two differ in one way that matters: `visibility:
    // hidden` also takes the subtree out of the accessibility tree and the tab
    // order, and opacity does not. Anything decorative therefore still needs
    // `aria-hidden` — it always did, since `visibility` cannot cross to native
    // at all.
    case 'invisible': return { opacity: 0 }
    case 'visible': return { opacity: 1 }
    // Where padding and border sit relative to a declared width. `content-box`
    // is the css default but NOT the default here: the browser reset every one
    // of these apps loads sets `border-box` on everything, so an element asking
    // for `box-content` is asking to opt back out and needs the property said.
    case 'box-content': return { boxSizing: 'content-box' }
    case 'box-border': return { boxSizing: 'border-box' }
    case 'flex-col': return { flexDirection: 'column' }
    case 'flex-row': return { flexDirection: 'row' }
    case 'flex-col-reverse': return { flexDirection: 'column-reverse' }
    case 'flex-row-reverse': return { flexDirection: 'row-reverse' }
    case 'flex-wrap': return { flexWrap: 'wrap' }
    case 'flex-nowrap': return { flexWrap: 'nowrap' }
    // `1 1 0%`, not `1 1 0px`. Against a parent of indefinite height a 0%
    // basis resolves as content and a 0px one does not, so the shorthand's
    // pixel basis collapsed every converted flex child to zero.
    case 'flex-1': return { flexGrow: 1, flexShrink: 1, flexBasis: '0%' }
    case 'flex-auto': return { flex: 'auto' }
    case 'flex-none': return { flex: 'none' }
    case 'flex-initial': return { flex: 'initial' }
    case 'flex-shrink-0': case 'shrink-0': return { flexShrink: 0 }
    case 'flex-grow': case 'grow': return { flexGrow: 1 }
    case 'flex-grow-0': case 'grow-0': return { flexGrow: 0 }
    case 'absolute': return { position: 'absolute' }
    case 'relative': return { position: 'relative' }
    case 'fixed': return { position: 'fixed' }
    case 'sticky': return { position: 'sticky' }
    case 'static': return { position: 'static' }
    case 'inset-0': return { top: 0, right: 0, bottom: 0, left: 0 }
    case 'uppercase': return { textTransform: 'uppercase' }
    case 'lowercase': return { textTransform: 'lowercase' }
    case 'capitalize': return { textTransform: 'capitalize' }
    case 'normal-case': return { textTransform: 'none' }
    case 'italic': return { fontStyle: 'italic' }
    case 'not-italic': return { fontStyle: 'normal' }
    case 'underline': return { textDecorationLine: 'underline' }
    case 'line-through': return { textDecorationLine: 'line-through' }
    case 'no-underline': return { textDecorationLine: 'none' }
    case 'truncate': return { overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }
    // A content column: full width, then bounded at each step up. Tailwind's
    // container is not centred on its own — `mx-auto` does that, and writing
    // both is the idiom, so centring here would silently widen the one caller
    // who wants a left-aligned column.
    case 'container': return {
      width: '100%',
      $sm: { maxWidth: 640 }, $md: { maxWidth: 768 },
      $lg: { maxWidth: 1024 }, $xl: { maxWidth: 1280 },
    }
    case 'mx-auto': return { marginLeft: 'auto', marginRight: 'auto' }
    case 'my-auto': return { marginTop: 'auto', marginBottom: 'auto' }
    case 'border': return { borderWidth: 1 }
    case 'rounded': return { borderRadius: RADIUS[''] }
    // SCROLL SNAP — how a carousel is built without a carousel library. The
    // browser does the paging; `scrollTo` and a scroll listener are the whole
    // API surface on top of it.
    case 'snap-none': return { scrollSnapType: 'none' }
    case 'snap-x': return { scrollSnapType: 'x mandatory' }
    case 'snap-y': return { scrollSnapType: 'y mandatory' }
    case 'snap-both': return { scrollSnapType: 'both mandatory' }
    // The axis classes above already say `mandatory`, which is the only
    // strictness this estate asks for. Tailwind spells it as a SECOND class,
    // so content copied from there carries one — absorb it rather than leave a
    // dead class behind, and let `snap-proximity` fall through to `rest` where
    // it is visible instead of silently reading as mandatory.
    case 'snap-mandatory': return {}
    case 'snap-start': return { scrollSnapAlign: 'start' }
    case 'snap-end': return { scrollSnapAlign: 'end' }
    case 'snap-center': return { scrollSnapAlign: 'center' }
    case 'snap-align-none': return { scrollSnapAlign: 'none' }
    case 'snap-normal': return { scrollSnapStop: 'normal' }
    case 'snap-always': return { scrollSnapStop: 'always' }
    case 'select-none': return { userSelect: 'none' }
    case 'pointer-events-none': return { pointerEvents: 'none' }
    case 'sr-only': return { position: 'absolute', width: 1, height: 1, overflow: 'hidden' }
    case 'tabular-nums': return { fontVariantNumeric: 'tabular-nums' }
    case 'transform': return { transform: 'translateZ(0)' }
    case 'transition': return { transitionProperty: TRANSITION.DEFAULT }
    case 'blur': return { filter: `blur(${BLUR.DEFAULT}px)` }
    case 'shadow': return { boxShadow: SHADOW.DEFAULT }
  }

  // A leading `-` negates whatever the rest of the class resolves to.
  if (c.startsWith('-')) {
    const pos = one(c.slice(1))
    if (!pos) return null
    const out: Props = {}
    for (const k in pos) {
      const v = pos[k]
      out[k] = typeof v === 'number' && NEGATABLE.test(k) ? -v
        : typeof v === 'string' && /^[\d.]+%$/.test(v) && NEGATABLE.test(k) ? `-${v}`
        // A transform is a function around its value, and the key is `transform`
        // whatever the class was — so the value carries the sign, and no test on
        // the property name can reach it.
        : k === 'transform' && typeof v === 'string' && TRANSFORM_FN.test(v)
          ? v.replace(TRANSFORM_FN, (_m, fn, n, unit) => `${fn}(${-Number(n)}${unit})`)
        : v
    }
    return out
  }

  // Heads are matched longest-first. A shortest-match split reads `max-w-3xl`
  // as `max` + `w-3xl`, so every compound head silently fell through.
  let head = '', v = ''
  for (const h of HEADS) {
    if (c.length > h.length + 1 && c.startsWith(h + '-')) { head = h; v = c.slice(h.length + 1); break }
  }
  if (!head) return null

  // padding and margin, whole box or one side
  const box = /^([pm])([xytrbl])?$/.exec(head)
  if (box) {
    const [, kind, where] = box
    const n = v === 'auto' ? 'auto' : SPACE[v] ?? size(v)
    if (n === undefined) return null
    const base = kind === 'p' ? 'padding' : 'margin'
    if (!where) return { [base]: n }
    if (where === 'x') return { [`${base}Left`]: n, [`${base}Right`]: n }
    if (where === 'y') return { [`${base}Top`]: n, [`${base}Bottom`]: n }
    return { [`${base}${SIDE[where]}`]: n }
  }

  switch (head) {
    case 'gap': { const n = SPACE[v] ?? size(v); return n === undefined ? null : { gap: n } }
    // Space BETWEEN children, which is what a gap is. Tailwind spelled it as a
    // margin on every child but the first, because it predates gap and had to
    // work inside a plain block; on a grid or a flex row the axis gap is the
    // same result with none of the first-child arithmetic. Named by axis, so
    // `space-y` is the ROW gap even when the container later becomes a grid
    // flowing the other way.
    case 'space-y': { const n = SPACE[v] ?? size(v); return n === undefined ? null : { rowGap: n } }
    case 'space-x': { const n = SPACE[v] ?? size(v); return n === undefined ? null : { columnGap: n } }
    case 'gap-x': { const n = SPACE[v] ?? size(v); return n === undefined ? null : { columnGap: n } }
    case 'gap-y': { const n = SPACE[v] ?? size(v); return n === undefined ? null : { rowGap: n } }
    case 'items': return ALIGN[v] ? { alignItems: ALIGN[v] } : null
    case 'justify': return ALIGN[v] ? { justifyContent: ALIGN[v] } : null
    case 'self': return ALIGN[v] ? { alignSelf: ALIGN[v] } : null
    case 'content': return ALIGN[v] ? { alignContent: ALIGN[v] } : null
    case 'w': { const n = size(v); return n === undefined ? null : { width: n } }
    case 'h': { const n = v === 'screen' ? '100vh' : size(v); return n === undefined ? null : { height: n } }
    case 'min-w': { const n = size(v); return n === undefined ? null : { minWidth: n } }
    case 'min-h': { const n = v === 'screen' ? '100vh' : size(v); return n === undefined ? null : { minHeight: n } }
    case 'max-w': { const n = MAX_W[v] ?? size(v); return n === undefined ? null : { maxWidth: n } }
    case 'max-h': { const n = v === 'screen' ? '100vh' : size(v); return n === undefined ? null : { maxHeight: n } }
    case 'text': {
      // A size utility sets BOTH — Tailwind pairs every `--text-*` with a
      // `--text-*--line-height`, and emitting the size alone leaves the element
      // on whatever leading it inherits. That measured as every converted
      // heading losing 8px of height and the page under it rising to match.
      // A size sets BOTH — Tailwind pairs every `--text-*` with a
      // `--text-*--line-height`, and emitting the size alone leaves the element
      // on whatever leading it inherits.
      //
      // The `normal` fallback is load-bearing, not decoration. NOTHING in the
      // shipped theme declares those paired variables — measured: zero of them
      // in dist/theme.css — so every named size resolved to an undefined
      // custom property, the declaration was dropped, and the element kept the
      // fixed leading gui had already put on it. A 48px heading came out in a
      // 20px box, at every size, everywhere. With the fallback the box tracks
      // the glyph, and a sheet that DOES declare the pair still wins.
      if (v in FONT_SIZE) {
        return { fontSize: FONT_SIZE[v], lineHeight: `var(--text-${v}--line-height, normal)` }
      }
      if (v === 'left' || v === 'center' || v === 'right' || v === 'justify') return { textAlign: v }
      // `text-` sets a size OR a colour, and an arbitrary value has to say
      // which. A LENGTH is a size: `text-[96px]` was reaching the colour branch
      // and returning `{ color: '96px' }` — a declaration the browser drops, so
      // the heading kept its inherited size and nothing anywhere reported a
      // problem. Measured on lux/bitcoin's 404, where a 96px numeral rendered
      // at 28px.
      const arb = /^\[(.+)]$/.exec(v)
      if (arb && /^-?[\d.]+(px|rem|em|ch|ex|vw|vh|vmin|vmax|%|pt)?$/.test(arb[1])) {
        // A size sets BOTH, exactly as the named steps do. Left alone, the line
        // height stays whatever gui last resolved — a fixed value that does not
        // track the glyph — so a 96px numeral sat in a 20px box and the
        // paragraph after it printed straight through the digits. Measured on
        // lux/bitcoin's 404.
        //
        // `normal` rather than a ratio: it is what a browser does for a font
        // this size, and it is the one value that is right without knowing the
        // unit — `1.05rem` and `50%` cannot be multiplied out here.
        return { fontSize: arb[1], lineHeight: 'normal' }
      }
      const col = color(v)
      return col ? { color: col } : null
    }
    case 'bg': {
      // `bg-` is a colour OR a background sub-property, and only the value says
      // which. `bg-clip-text` was reaching the colour branch and returning
      // `backgroundColor: var(--clip-text)` — a variable nothing declares, so
      // the declaration was dropped and `background-clip` was never set.
      //
      // That one matters more than it looks: `bg-gradient-* … bg-clip-text
      // text-transparent` is how gradient TEXT is written, and without the clip
      // the gradient paints the whole box instead of the glyphs. Measured on
      // lux/mint, where a heading rendered as a solid gradient bar.
      const clip = /^clip-(text|border|padding|content)$/.exec(v)
      if (clip) {
        const box = clip[1] === 'text' ? 'text' : `${clip[1]}-box`
        // Safari still wants the prefix for the text value.
        return { backgroundClip: box, WebkitBackgroundClip: box }
      }
      const origin = /^origin-(border|padding|content)$/.exec(v)
      if (origin) return { backgroundOrigin: `${origin[1]}-box` }
      const col = color(v)
      return col ? { backgroundColor: col } : null
    }
    case 'font': return WEIGHT[v] !== undefined ? { fontWeight: WEIGHT[v] }
      : FAMILY[v] ? { fontFamily: FAMILY[v] } : null
    case 'leading': {
      // A named step is a RATIO and stays unitless. A numbered one
      // (`leading-8`) is a LENGTH off the spacing ramp — and it has to say so.
      //
      // It used to be emitted as a bare number, on the reasoning that a length
      // is a number. But a bare number in a line-height position is a RATIO,
      // and that is how it was read: `leading-8` became a 32x multiplier, so a
      // 15px paragraph got a 480px line box and two lines of text stood 960px
      // tall. Measured on lux/mint, where it opened a 700px hole in the middle
      // of the page that read as a layout problem rather than a unit one.
      const arb = /^\[(.+)]$/.exec(v)
      if (arb) return { lineHeight: arb[1] }
      if (v in LEADING) return { lineHeight: LEADING[v] }
      return v in SPACE ? { lineHeight: `${SPACE[v]}px` } : null
    }
    case 'tracking': {
      if (TRACKING[v] !== undefined) return { letterSpacing: TRACKING[v] }
      // The named steps are the common case, but wide display type is usually
      // set in em so it tracks the size — `tracking-[0.2em]` on a small
      // uppercase label is the idiom, and it was staying on the element.
      const arb = /^\[(.+)]$/.exec(v)
      return arb ? { letterSpacing: arb[1] } : null
    }
    // How far an underline sits below the text. Tailwind's ramp is in px, and
    // the point of using it is that a link in running text can clear the
    // descenders instead of cutting through them.
    case 'underline-offset': {
      const arb = /^\[(.+)]$/.exec(v)
      if (arb) return { textUnderlineOffset: arb[1] }
      return /^\d+$/.test(v) ? { textUnderlineOffset: `${v}px` }
        : v === 'auto' ? { textUnderlineOffset: 'auto' } : null
    }
    case 'rounded': {
      if (v in RADIUS) return { borderRadius: RADIUS[v] }
      const side = /^([trbl]|tl|tr|br|bl)-(.+)$/.exec(v)
      if (side && side[2] in RADIUS) return { [`border${CORNER[side[1]]}Radius`]: RADIUS[side[2]] }
      return null
    }
    case 'border': {
      if (/^\d+$/.test(v)) return { borderWidth: +v }
      const side = /^([trbl])(?:-(\d+))?$/.exec(v)
      if (side) return { [`border${SIDE[side[1]]}Width`]: side[2] ? +side[2] : 1 }
      const col = color(v)
      return col ? { borderColor: col } : null
    }
    case 'opacity': return /^\d+$/.test(v) ? { opacity: +v / 100 } : null
    // A rung OR a value written out. `z-[60]` is how anything above the named
    // scale is spelled, and it was unread — so a phone menu asking to sit over a
    // `z-50` header got no z-index at all, and the header kept the click.
    case 'z': {
      if (/^-?\d+$/.test(v)) return { zIndex: +v }
      const arb = /^\[(-?\d+)]$/.exec(v)
      return arb ? { zIndex: +arb[1] } : null
    }
    // Every cursor, not a list of them. Tailwind's names ARE the CSS values —
    // `grab`, `not-allowed`, `zoom-in` — so enumerating them would be copying
    // the CSS spec into a table that then goes stale one keyword at a time.
    // `cursor-pointer` was the only one spelled out, and a drag handle asking
    // for `cursor-grab` got a class no sheet serves.
    case 'cursor': return { cursor: v }
    case 'overflow': return { overflow: v }
    case 'overflow-x': return { overflowX: v }
    case 'overflow-y': return { overflowY: v }
    case 'top': case 'right': case 'bottom': case 'left': {
      const n = v === 'auto' ? 'auto' : SPACE[v] ?? size(v)
      return n === undefined ? null : { [head]: n }
    }
    case 'inset': { const n = SPACE[v] ?? size(v); return n === undefined ? null : { top: n, right: n, bottom: n, left: n } }
    // ── Grid ────────────────────────────────────────────────────────────────
    // A track list is written three ways and all three have to read, because a
    // real layout uses all three: a COUNT of equal tracks (`grid-cols-3`), an
    // explicit list (`grid-cols-[1fr_auto]`, where Tailwind's underscores stand
    // in for the spaces a class name cannot hold), or `none`.
    case 'grid-cols': return track(v, 'gridTemplateColumns')
    case 'grid-rows': return track(v, 'gridTemplateRows')
    // How IMPLICIT tracks are sized — the property that decides whether a grid
    // row behaves like a flex row. `grid-flow-col` alone gives every child an
    // equal `1fr` share, so a row of buttons comes out stretched; with
    // `auto-cols-max` each track is its own content's width, which is what a
    // flex row does and what the caller almost always meant.
    // An arbitrary track sits beside the named ones. `auto-cols-[100%]` is how a
    // carousel says "one slide per view", and it is the only way to say it —
    // the named set is auto/min/max/fr and none of them is a page.
    case 'auto-cols': { const a = auto(v); return a ? { gridAutoColumns: a } : null }
    case 'auto-rows': { const a = auto(v); return a ? { gridAutoRows: a } : null }
    case 'grid-flow': return FLOW[v] ? { gridAutoFlow: FLOW[v] } : null
    case 'col-span': return v === 'full'
      ? { gridColumn: '1 / -1' } : /^\d+$/.test(v) ? { gridColumn: `span ${v} / span ${v}` } : null
    // A line, not a span. `-1` is the last line, which is how a cell is pinned
    // to the end of a row whose track count is not known here.
    case 'col-start': return line(v, 'gridColumnStart')
    case 'col-end': return line(v, 'gridColumnEnd')
    case 'row-start': return line(v, 'gridRowStart')
    case 'row-end': return line(v, 'gridRowEnd')
    // `place-*` sets the block and inline axes at once. On a grid that is the
    // ordinary way to centre something, and it is one class rather than the two
    // a flex container needs.
    case 'place-items': return { alignItems: ALIGN[v] ?? v, justifyItems: ALIGN[v] ?? v }
    case 'place-content': return { alignContent: ALIGN[v] ?? v, justifyContent: ALIGN[v] ?? v }
    case 'place-self': return { alignSelf: ALIGN[v] ?? v, justifySelf: ALIGN[v] ?? v }
    case 'justify-items': return { justifyItems: ALIGN[v] ?? v }
    case 'justify-self': return { justifySelf: ALIGN[v] ?? v }
    case 'aspect': return v === 'square' ? { aspectRatio: 1 } : v === 'video' ? { aspectRatio: 16 / 9 } : null
    case 'object': return { objectFit: v }
    case 'whitespace': return { whiteSpace: v }
    case 'align': return { verticalAlign: v }
    case 'transition': return TRANSITION[v] ? { transitionProperty: TRANSITION[v] } : null
    case 'duration': return DURATION[v] !== undefined ? { transitionDuration: `${DURATION[v]}ms` } : null
    case 'delay': return DURATION[v] !== undefined ? { transitionDelay: `${DURATION[v]}ms` } : null
    // `ease` was in the head list with no case, so `transition duration-500
    // ease-out` converted two thirds of one declaration and left the curve on
    // the element as a dead class. The three named curves are Tailwind's own.
    case 'ease': return EASE[v] ? { transitionTimingFunction: EASE[v] } : null
    case 'blur': return BLUR[v] !== undefined ? { filter: `blur(${BLUR[v]}px)` } : null
    case 'backdrop-blur': return BLUR[v] !== undefined ? { backdropFilter: `blur(${BLUR[v]}px)` } : null
    // `space-y` is deliberately NOT converted. It sets margins on the CHILDREN,
    // and `gap` only reproduces that on a flex or grid container — on a block
    // one the spacing disappears with nothing to show for it. Left as a class,
    // so the rule that works keeps working.
    case 'row-span': return /^\d+$/.test(v) ? { gridRow: `span ${v} / span ${v}` } : null
    case 'translate-x': { const n = SPACE[v] ?? size(v); return n === undefined ? null
      : { transform: `translateX(${typeof n === 'number' ? n + 'px' : n})` } }
    case 'translate-y': { const n = SPACE[v] ?? size(v); return n === undefined ? null
      : { transform: `translateY(${typeof n === 'number' ? n + 'px' : n})` } }
    // A named rung, or a shadow written out. The written-out form is not an
    // edge case: a hard offset shadow — `shadow-[8px_8px_0_0_#000]` — has no
    // rung to name, and a design built on one loses every shadow it has
    // without this. Underscores stand for spaces, as everywhere in a bracket.
    case 'shadow': {
      if (SHADOW[v]) return { boxShadow: SHADOW[v] }
      const arb = /^\[(.+)]$/.exec(v)
      return arb ? { boxShadow: unscore(arb[1]) } : null
    }
    // `inset-0` sets all four; the axis forms set a pair. They arrive here as
    // their own head, which is why each needs naming.
    case 'inset-x': { const n = SPACE[v] ?? size(v); return n === undefined ? null : { left: n, right: n } }
    case 'inset-y': { const n = SPACE[v] ?? size(v); return n === undefined ? null : { top: n, bottom: n } }
  }
  return null
}

const EASE: Record<string, string> = {
  linear: 'linear',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
}

const MAX_W: Record<string, string | number> = {
  none: 'none', xs: 320, sm: 384, md: 448, lg: 512, xl: 576, '2xl': 672,
  '3xl': 768, '4xl': 896, '5xl': 1024, '6xl': 1152, '7xl': 1280, full: '100%',
  prose: '65ch', screen: '100vw',
  // `max-w-screen-<rung>` is the BREAKPOINT width, not the size ramp above —
  // the idiom for "hold the content to the width this layout was designed at".
  // Unlisted, `max-w-screen-xl` fell through as an unread class and the
  // container it bounds grew to whatever the viewport was.
  'screen-sm': 640, 'screen-md': 768, 'screen-lg': 1024, 'screen-xl': 1280, 'screen-2xl': 1536,
}

const CORNER: Record<string, string> = {
  t: 'Top', r: 'Right', b: 'Bottom', l: 'Left',
  tl: 'TopLeft', tr: 'TopRight', br: 'BottomRight', bl: 'BottomLeft',
}

/** Where a prefixed class lands: a gui media prop, or a pseudo-style. */
const VARIANT: Record<string, string> = {
  // `xs` is the smallest rung, so it lands at the BASE — an empty destination,
  // not a `$xs` bucket. gui publishes no `$xs` media prop because there is
  // nothing below it: a style with no media wrapper already applies there, and
  // every larger rung overrides it in turn. That is also what `xs` meant in the
  // tailwind config this notation came from, where it was a custom screen at
  // the bottom rather than one of tailwind's own.
  //
  // It has to be HERE rather than absent: content authored on 5.x writes the
  // rung out explicitly (`SPACE_DEFAULTS` and `GridDef.at` both start at `xs`),
  // and an unlisted prefix keeps the whole class as an unconverted string — so
  // the smallest rung of every ladder would be the one silently dropped.
  xs: '',
  sm: '$sm', md: '$md', lg: '$lg', xl: '$xl', '2xl': '$2xl',
  hover: 'hoverStyle', focus: 'focusStyle', 'focus-visible': 'focusVisibleStyle',
  active: 'pressStyle', disabled: 'disabledStyle', dark: '$theme-dark',
  'group-hover': 'groupHoverStyle',
}

// The class list and the way it is flattened belong to `cn`, which is where
// both this and every caller already needed them. Re-exported so the existing
// `import { type ClassValue } from '@hanzo/ui/tw'` keeps working.
export type { ClassValue } from './core/cn'

/**
 * `tw('flex items-center gap-4 md:gap-8 hover:bg-muted')` becomes
 * `{ display, flexDirection, alignItems, gap, $md: { gap }, hoverStyle: { backgroundColor } }`.
 */
export function tw(input: ClassValue): Parsed {
  const props: Props = {}
  const rest: string[] = []
  // A gradient is the one value spelled across several classes — a direction
  // and its stops — so it is assembled here rather than in `one`, which sees
  // a single class and could only ever produce a fragment of it.
  const grad: { dir?: string; from?: string; via?: string; to?: string } = {}

  for (const raw of flatten(input)) {
    // A class may carry several prefixes; the last one is the variant that
    // decides where it lands, and an unknown prefix keeps the whole class.
    const parts = raw.split(':')
    const bare = parts.pop() as string

    if (!parts.length) {
      const g = /^(?:bg-gradient-to-([a-z]{1,2})|(from|via|to)-(.+))$/.exec(bare)
      if (g) {
        if (g[1]) grad.dir = DIRECTION[g[1]]
        else grad[g[2] as 'from' | 'via' | 'to'] = color(g[3])
        continue
      }
    }

    const found = one(bare)
    if (!found) { rest.push(raw); continue }
    if (!parts.length) { Object.assign(props, found); continue }

    const key = VARIANT[parts[parts.length - 1]]
    if (key === undefined) { rest.push(raw); continue }
    // An empty destination is the base rung (`xs:`), which is where a style with
    // no media wrapper already lives — so it merges into props rather than
    // opening a bucket gui would never read.
    if (!key) { Object.assign(props, found); continue }
    const bucket = (props[key] ??= {}) as Props
    Object.assign(bucket, found)
  }

  // A stop with no direction still reads as a gradient; Tailwind's own
  // default is left-to-right.
  const stops = [grad.from, grad.via, grad.to].filter(Boolean)
  if (stops.length > 1) {
    props.backgroundImage = `linear-gradient(${grad.dir ?? 'to right'}, ${stops.join(', ')})`
  }

  return { props, rest: rest.join(' ') }
}

export default tw
