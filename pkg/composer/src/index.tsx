'use client'

/**
 * The composer's material: a lit ring around anything you can type into, as gui
 * components.
 *
 * `Composer` is the host. It wraps the surface's own panel and draws the ring
 * and the halo as two absolutely placed children, so the panel stays the
 * surface's: opaque, glass, anything. `Control` is the round button inside it
 * (the plus, the mic, the send), and `Field` is the input with its chrome taken
 * off, because the ring outside it is already the control's edge.
 *
 * Every paint is a gui prop reading a @hanzo/design token, so a host writes no
 * rule against this package: `--radius-composer` shapes the host, `--density`
 * sizes the controls, `--muted` / `--primary` paint them. The one stylesheet is
 * the sweep itself — a conic angle animates only through `@property` and
 * `@keyframes`, which no prop can say — and it is keyed on the data-slots
 * below, rendered once through React's hoisted `<style>`.
 */
import { Input, Text, View, styled } from '@hanzo/gui'
import { createContext, useContext, type ComponentProps } from 'react'

/**
 * A value the style types have no literal for: a design token read through
 * `var()` where the slot types tokens only, or an ink on a frame whose pseudo
 * types know only View's table. The value reaches the DOM as written.
 */
const raw = <T,>(v: T) => v as never

/** The host's slot, and the prefix of its parts' slots. */
export const SLOT = 'prism'

/**
 * Two alphas of white, closing on the stop they opened with — a conic gradient
 * whose first and last stop differ shows a seam.
 *
 * LUMINANCE, NOT HUE: a conic gradient does not spread stops evenly round a
 * rounded rectangle. The long edges take a wide angular slice and the short
 * sides almost none, so saturated stops put a bright arc on one edge and a dim
 * one opposite. Two close alphas have no bright arc to land in the wrong place;
 * the drift survives as sheen.
 */
export const SPECTRUM =
  'rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.1)'

/** The sweep both layers paint. The angle falls back to rest where `@property` is unknown. */
const SWEEP = `conic-gradient(from var(--prism-angle, 0deg), ${SPECTRUM})`

/**
 * The mask that leaves only the padding band: `content-box` is the hole, the
 * full box the plate, and `exclude` keeps the lip. That is what makes the ring a
 * rim by construction rather than a disc behind the panel.
 */
const MASK = 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)'

/** @hanzo/design's composer corner, with the pill as the floor for a host without design. */
const ROUND = 'var(--radius-composer, 9999px)'

/**
 * The sweep and the four preferences that quiet it. Keyed on data-slots, never
 * a class. `!important` where it overrides a gui prop, because a compiled prop
 * is an atomic class in a sheet inserted after this one.
 */
export const SHEET = [
  '@property --prism-angle{syntax:"<angle>";initial-value:0deg;inherits:false}',
  '@keyframes prism-orbit{to{--prism-angle:360deg}}',
  ":is([data-slot='prism-ring'],[data-slot='prism-halo']){animation:prism-orbit 10s linear infinite}",
  "@media (prefers-reduced-motion: reduce){:is([data-slot='prism-ring'],[data-slot='prism-halo']){animation:none}}",
  "@media (prefers-reduced-transparency: reduce){[data-slot='prism-halo']{display:none}[data-slot='prism-ring']{opacity:1!important}}",
  "@media (prefers-contrast: more){[data-slot='prism-halo']{display:none}[data-slot='prism-ring']{opacity:1!important;background:#fff!important;animation:none}}",
  "@media (forced-colors: active){:is([data-slot='prism-ring'],[data-slot='prism-halo']){display:none}[data-slot='prism']{outline:1px solid CanvasText}}",
].join('\n')

/** The ring at rest and under a pointer. */
export const REST = 0.5
export const LIFT = 0.8
/** The halo: quiet and still. A halo that pulses or lifts reads as a wash over the page. */
export const GLOW = 0.22

/**
 * The ring: the sweep masked down to the host's padding band. It rests quiet and
 * lifts under a pointer. Focus keeps the rest value: the caret is already the
 * answer to where focus is, and a ring that brightens under it says it twice.
 */
const Ring = styled(View, {
  name: 'PrismRing',
  position: 'absolute',
  t: 0,
  r: 0,
  b: 0,
  l: 0,
  pointerEvents: 'none',
  opacity: REST,
  '$group-hover': { opacity: LIFT },
})

/**
 * The halo: the same sweep, blurred, outside the box, lighting the air round the
 * panel and nothing behind it. Its corner is the host's plus its own reach,
 * because a box larger on every side needs a wider corner to stay concentric.
 */
const Halo = styled(View, {
  name: 'PrismHalo',
  position: 'absolute',
  pointerEvents: 'none',
  opacity: GLOW,
  filter: 'blur(16px)',
})

const Host = styled(View, {
  name: 'Prism',
  position: 'relative',
  isolation: 'isolate',
  rounded: ROUND,
})

/** The control size a `Composer` hands its `Control`s, px before density. */
const Size = createContext(34)

export type ComposerProps = ComponentProps<typeof Host> & {
  /** The ring's width, px. It is also the host's padding: one number, read twice. */
  band?: number
  /** How far the halo reaches past the box, px. */
  halo?: number
  /** The round controls' box, px, before `--density`. */
  control?: number
}

/**
 * The host. Its padding IS the band, so the ring and the gap it shows cannot
 * disagree. Both layers sit under the panel (negative z in the host's own
 * stacking context), so the panel and anything it draws stay on top.
 */
export function Composer({ band = 1.5, halo = 6, control = 34, children, ...props }: ComposerProps) {
  const fade = { transition: 'opacity 200ms ease' } as const
  return (
    <Size.Provider value={control}>
      <Host data-slot={SLOT} group p={band} {...props}>
        <style href="hanzo-composer" precedence="default">
          {SHEET}
        </style>
        <Halo
          data-slot="prism-halo"
          aria-hidden
          t={-halo}
          r={-halo}
          b={-halo}
          l={-halo}
          p={halo}
          backgroundImage={SWEEP}
          mask={MASK}
          maskComposite="exclude"
          style={{ zIndex: -2, borderRadius: `calc(${ROUND} + ${halo}px)`, ...fade }}
        />
        <Ring
          data-slot="prism-ring"
          aria-hidden
          p={band}
          rounded="inherit"
          backgroundImage={SWEEP}
          mask={MASK}
          maskComposite="exclude"
          style={{ zIndex: -1, ...fade }}
        />
        {children}
      </Host>
    </Size.Provider>
  )
}

/**
 * The round control's frame: a button, with Text's style table so it can carry
 * an ink (`color`) for the glyph inside it. Its paint is passed as props by
 * `Control` rather than set as styled defaults, because `asChild` merges a
 * component's PROPS onto the child and leaves its defaults behind.
 */
const Round = styled(View, { name: 'PrismControl', render: 'button' }, { validStyles: Text.staticConfig.validStyles })

/** The circle: centred glyph, no edge, no padding, the full radius. */
const SHAPE = {
  display: 'inline-flex',
  items: 'center',
  justify: 'center',
  shrink: 0,
  p: 0,
  borderWidth: 0,
  rounded: 'var(--radius-full, 9999px)',
  cursor: 'pointer',
  disabledStyle: { opacity: 0.4, cursor: 'default' },
} as const

/** At rest: the quiet control, lifting to the accent under a pointer. */
const QUIET = raw({
  bg: 'var(--muted)',
  color: 'var(--text-secondary)',
  hoverStyle: { bg: 'var(--primary)', color: 'var(--primary-foreground)' },
})

/** The send: one shape, filled when it is the thing to do. */
const FILLED = raw({
  bg: 'var(--primary)',
  color: 'var(--primary-foreground)',
  hoverStyle: { bg: 'var(--primary)', color: 'var(--primary-foreground)', opacity: 0.9 },
})

export type ControlProps = Omit<ComponentProps<typeof Round>, 'size'> & {
  /** The send control: filled with the accent. */
  fill?: boolean
  /** The button's own type. A control inside a form submits unless it says otherwise. */
  type?: 'button' | 'submit' | 'reset'
  /** Its box, px before `--density`. Unset, the size its `Composer` names. */
  size?: number
}

/**
 * Colour and opacity ease; `outline-color` rides the list although nothing here
 * changes it, because a control that could flash on focus is only proved not to
 * by transitioning it.
 */
const EASE = ['background-color', 'color', 'opacity', 'outline-color']
  .map((p) => `${p} var(--duration-fast, 150ms) var(--ease-in-out, ease)`)
  .join(', ')

/**
 * A round control. A circle at the size its `Composer` names, scaled by
 * `--density` and floored at 24px (WCAG 2.5.8 AA), so no density can shrink a
 * target under it. The 44px coarse-pointer floor does not apply: the tap target
 * in a composer is the field, the width of the column, and these are its
 * secondary chrome.
 *
 * A control another package draws — the mic `@hanzo/voice` renders — wears this
 * shape through `asChild`: `<Control asChild><Voice voice={voice} /></Control>`.
 * The child keeps its own element, handlers and children; the circle and the
 * paint are merged onto it.
 */
export function Control({ size: own, fill = false, style, ...props }: ControlProps) {
  const named = useContext(Size)
  const size = `max(24px, calc(${own ?? named}px * var(--density, 1)))` as const
  return (
    <Round
      data-slot="prism-control"
      {...SHAPE}
      {...((fill ? FILLED : QUIET) as object)}
      width={size}
      height={size}
      minW={size}
      minH={size}
      style={{ transition: EASE, ...(style as object) }}
      {...props}
    />
  )
}

/**
 * The field: the composite control's interior, not a field of its own. No
 * border, no surface, no native appearance and no outline of its own — the ring
 * is the edge — on the base rung of the type ramp, taking the row's spare width
 * down to zero so a long prompt never pushes the controls out of the pill.
 */
export type FieldProps = ComponentProps<typeof Input>

export function Field(props: FieldProps) {
  return (
    <Input
      data-slot="prism-field"
      unstyled
      flex={1}
      minW={0}
      height="auto"
      minH={0}
      px={8}
      py={0}
      rounded={0}
      bg="transparent"
      borderWidth={0}
      outlineWidth={0}
      fontSize={raw('var(--text-base, 14px)')}
      color="var(--foreground)"
      placeholderTextColor={raw('var(--muted-foreground)')}
      focusVisibleStyle={{ outlineWidth: 0 }}
      {...props}
    />
  )
}
