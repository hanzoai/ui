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

const RADIUS: Record<string, number> = {
  none: 0, sm: 2, '': 4, md: 6, lg: 8, xl: 12, '2xl': 16, '3xl': 24, full: 9999,
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
  'row-span', 'translate-x', 'translate-y', 'gap-x', 'gap-y', 'space-x', 'space-y', 'overflow-x', 'overflow-y',
  'transition', 'duration', 'delay', 'ease', 'blur', 'backdrop-blur', 'shadow',
  'overflow',
  'tracking', 'leading', 'rounded', 'border', 'divide', 'aspect', 'object',
  'whitespace', 'align', 'inset', 'items', 'justify', 'content', 'self',
  'opacity', 'text', 'font', 'bg', 'gap', 'top', 'right', 'bottom', 'left',
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

/** A size word, a fraction, or a step on the ramp. */
function size(v: string): string | number | undefined {
  if (v === 'full') return '100%'
  if (v === 'screen') return '100vh'
  if (v === 'auto' || v === 'fit' || v === 'min' || v === 'max') return v === 'fit' ? 'fit-content' : v
  if (v in SPACE) return SPACE[v]
  const frac = /^(\d+)\/(\d+)$/.exec(v)
  if (frac) return `${((+frac[1] / +frac[2]) * 100).toFixed(4).replace(/\.?0+$/, '')}%`
  const arb = /^\[(.+)]$/.exec(v)
  if (arb) return arb[1]
  return undefined
}

/**
 * A colour is a CSS custom property, so `text-foreground` stays exactly the
 * value the sheet already resolves — the palette is not restated here. The
 * `/NN` suffix is an alpha, which `color-mix` applies without needing to know
 * what the variable holds.
 */
function color(v: string): string | undefined {
  if (v === 'transparent') return 'transparent'
  if (v === 'current') return 'currentColor'
  if (v === 'white') return '#fff'
  if (v === 'black') return '#000'
  const m = /^(.+?)(?:\/(\d{1,3}))?$/.exec(v)
  if (!m) return undefined
  const [, name, alpha] = m
  const arb = /^\[(.+)]$/.exec(name)
  const base = arb ? arb[1]
    : name === 'white' ? '#fff' : name === 'black' ? '#000'
    : `var(--${name})`
  if (!alpha) return base
  return `color-mix(in srgb, ${base} ${alpha}%, transparent)`
}

/** Properties a negative class may set — the rest have no negative form. */
const NEGATABLE = /^(margin|top|right|bottom|left|zIndex|translate)/

/** One class to zero or more props. Returns null when the class is unknown. */
function one(c: string): Props | null {
  // display and the flex words
  switch (c) {
    case 'flex': return { display: 'flex', flexDirection: 'row' }
    case 'inline-flex': return { display: 'inline-flex', flexDirection: 'row' }
    case 'grid': return { display: 'grid' }
    case 'block': return { display: 'block' }
    case 'inline': return { display: 'inline' }
    case 'inline-block': return { display: 'inline-block' }
    case 'hidden': return { display: 'none' }
    case 'flex-col': return { flexDirection: 'column' }
    case 'flex-row': return { flexDirection: 'row' }
    case 'flex-col-reverse': return { flexDirection: 'column-reverse' }
    case 'flex-row-reverse': return { flexDirection: 'row-reverse' }
    case 'flex-wrap': return { flexWrap: 'wrap' }
    case 'flex-nowrap': return { flexWrap: 'nowrap' }
    case 'flex-1': return { flex: 1 }
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
    case 'mx-auto': return { marginLeft: 'auto', marginRight: 'auto' }
    case 'my-auto': return { marginTop: 'auto', marginBottom: 'auto' }
    case 'border': return { borderWidth: 1 }
    case 'rounded': return { borderRadius: RADIUS[''] }
    case 'cursor-pointer': return { cursor: 'pointer' }
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
      if (v in FONT_SIZE) return { fontSize: FONT_SIZE[v], lineHeight: `var(--text-${v}--line-height)` }
      if (v === 'left' || v === 'center' || v === 'right' || v === 'justify') return { textAlign: v }
      const col = color(v)
      return col ? { color: col } : null
    }
    case 'bg': { const col = color(v); return col ? { backgroundColor: col } : null }
    case 'font': return WEIGHT[v] !== undefined ? { fontWeight: WEIGHT[v] }
      : FAMILY[v] ? { fontFamily: FAMILY[v] } : null
    case 'leading': {
      // A named step is a RATIO and must stay unitless; a numbered one
      // (`leading-6`) is a length off the spacing ramp and stays a number.
      const arb = /^\[(.+)]$/.exec(v)
      if (arb) return { lineHeight: arb[1] }
      if (v in LEADING) return { lineHeight: LEADING[v] }
      return v in SPACE ? { lineHeight: SPACE[v] } : null
    }
    case 'tracking': return TRACKING[v] !== undefined ? { letterSpacing: TRACKING[v] } : null
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
    case 'z': return /^\d+$/.test(v) ? { zIndex: +v } : null
    case 'overflow': return { overflow: v }
    case 'overflow-x': return { overflowX: v }
    case 'overflow-y': return { overflowY: v }
    case 'top': case 'right': case 'bottom': case 'left': {
      const n = v === 'auto' ? 'auto' : SPACE[v] ?? size(v)
      return n === undefined ? null : { [head]: n }
    }
    case 'inset': { const n = SPACE[v] ?? size(v); return n === undefined ? null : { top: n, right: n, bottom: n, left: n } }
    case 'grid-cols': return /^\d+$/.test(v)
      ? { gridTemplateColumns: `repeat(${v}, minmax(0, 1fr))` } : null
    case 'grid-rows': return /^\d+$/.test(v)
      ? { gridTemplateRows: `repeat(${v}, minmax(0, 1fr))` } : null
    case 'col-span': return v === 'full'
      ? { gridColumn: '1 / -1' } : /^\d+$/.test(v) ? { gridColumn: `span ${v} / span ${v}` } : null
    case 'aspect': return v === 'square' ? { aspectRatio: 1 } : v === 'video' ? { aspectRatio: 16 / 9 } : null
    case 'object': return { objectFit: v }
    case 'whitespace': return { whiteSpace: v }
    case 'align': return { verticalAlign: v }
    case 'transition': return TRANSITION[v] ? { transitionProperty: TRANSITION[v] } : null
    case 'duration': return DURATION[v] !== undefined ? { transitionDuration: `${DURATION[v]}ms` } : null
    case 'delay': return DURATION[v] !== undefined ? { transitionDelay: `${DURATION[v]}ms` } : null
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
    case 'shadow': return SHADOW[v] ? { boxShadow: SHADOW[v] } : null
  }
  return null
}

const MAX_W: Record<string, string | number> = {
  none: 'none', xs: 320, sm: 384, md: 448, lg: 512, xl: 576, '2xl': 672,
  '3xl': 768, '4xl': 896, '5xl': 1024, '6xl': 1152, '7xl': 1280, full: '100%',
  prose: '65ch', screen: '100vw',
}

const CORNER: Record<string, string> = {
  t: 'Top', r: 'Right', b: 'Bottom', l: 'Left',
  tl: 'TopLeft', tr: 'TopRight', br: 'BottomRight', bl: 'BottomLeft',
}

/** Where a prefixed class lands: a gui media prop, or a pseudo-style. */
const VARIANT: Record<string, string> = {
  sm: '$sm', md: '$md', lg: '$lg', xl: '$xl', '2xl': '$2xl',
  hover: 'hoverStyle', focus: 'focusStyle', 'focus-visible': 'focusVisibleStyle',
  active: 'pressStyle', disabled: 'disabledStyle', dark: '$theme-dark',
  'group-hover': 'groupHoverStyle',
}

export type ClassValue =
  | string | number | null | undefined | false
  | ClassValue[]
  | Record<string, unknown>

/** clsx's input shapes, since callers already write class names that way. */
function flatten(v: ClassValue, out: string[] = []): string[] {
  if (!v) return out
  if (typeof v === 'string') { for (const s of v.split(/\s+/)) if (s) out.push(s); return out }
  if (typeof v === 'number') { out.push(String(v)); return out }
  if (Array.isArray(v)) { for (const x of v) flatten(x, out); return out }
  for (const k in v) if ((v as Record<string, unknown>)[k]) out.push(k)
  return out
}

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
    if (!key) { rest.push(raw); continue }
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
