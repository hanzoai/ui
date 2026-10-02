'use client'

/**
 * Surfaces that answer approach, and the marks inside them that answer with
 * them.
 *
 *   Leaf    a card: a corner, an edge that brightens on hover, no ground
 *   Cell    a tile of a ruled grid: no corner and no edge, a ground that brightens
 *   Lift    ink that brightens when its card is hovered; `step` also moves it
 *           2px toward where it goes
 *   Reveal  a line offered only on approach — hover, or a keyboard's focus
 *   Lattice a ruled backdrop: a decorative grid behind a hero
 *
 * A Leaf or a Cell is a gui `group`, and the marks read it with `$group-hover`,
 * so the card decides when and the mark decides how. It is a group and NOT a
 * size container: gui's default `container-type: inline-size` sizes the box as
 * if it were empty, so a card a row sizes by its content — a filter chip —
 * collapsed to its own padding. No mark asks the group its size. An ink written on a mark
 * is a prop beside the hover, so nothing has to out-rank anything: the lift a
 * stylesheet used to apply lost to every atomic `color` a mark carried, and
 * those cards never lifted.
 *
 * Every default is a prop a caller replaces: `p` for the padding, `borderColor`
 * for the resting edge, `hoverStyle` for the approach, `bg` for a ground.
 */
import { Text, View, type TextProps, type ViewProps } from '@hanzo/gui'
import { slot } from '../backends/gui/slot'
import { useHost } from './host'
import type { Host, Loose } from './loose'

export type SurfaceProps = Loose<Omit<TextProps, 'render' | 'children'>> &
  Host & {
    render?: TextProps['render']
  }

/** The element's own display — what @hanzo/design's base or the browser gives
 *  it — under gui Text's `inline`. */
const OWN = 'revert-layer' as 'block'

/** The element's own ink, the same way: @hanzo/design's base gives every `<a>`
 *  and every heading `--text-primary`, and anything else takes its parent's. */
const INK = 'revert-layer' as 'inherit'

/** The lifted ink: white on the dark ground, ink on the light one. */
const LIFT = 'var(--text-primary)'

/** A card. The defaults change nothing but the corner and the hover edge: no
 *  ground, a transparent resting edge, so a card that names only a ground gets
 *  a ground and no lift. */
const Leaf = ({ render, ...p }: SurfaceProps) => {
  const host = useHost(render, p.href, 'div')
  return (
    <Text
      {...slot('leaf')}
      group
      containerType="normal"
      render={host}
      display="block"
      height="100%"
      whiteSpace="inherit"
      textDecorationLine="none"
      color={INK}
      p="$4"
      borderWidth={1}
      borderStyle="solid"
      borderColor="transparent"
      rounded="var(--radius-xl)"
      hoverStyle={{ borderColor: 'var(--white-15)' }}
      {...(p as object)}
    />
  )
}

/** A tile of a ruled grid, which rules its own lines with a 1px gap over a
 *  neutral ground — so a Cell adds no edge and no corner, which would break the
 *  flush rule the grid is made of, and no box: the element keeps the display the
 *  document gives it, so a row stays a row and an icon button stays centred. */
const Cell = ({ render, ...p }: SurfaceProps) => {
  const host = useHost(render, p.href, 'div')
  return (
    <Text
      {...slot('cell')}
      group
      containerType="normal"
      render={host}
      display={OWN}
      whiteSpace="inherit"
      textDecorationLine="none"
      bg="var(--pure-black)"
      color="inherit"
      hoverStyle={{ bg: 'var(--neutral-950)' }}
      {...(p as object)}
    />
  )
}

/** Ink that brightens with its card. Inline, like the word or icon it wraps;
 *  a mark that steps is a box (`display="inline-flex"`), because an inline box
 *  does not move. */
const Lift = ({ render = 'span', step = false, ...p }: SurfaceProps & { step?: boolean }) => (
  <Text
    {...slot('lift')}
    render={render}
    display={OWN}
    whiteSpace="inherit"
    color={INK}
    transition={(step
      ? 'color var(--duration-fast) var(--ease-in-out), transform var(--duration-fast) var(--ease-in-out)'
      : 'color var(--duration-fast) var(--ease-in-out)') as never}
    $group-hover={step ? { color: LIFT, x: 2 } : { color: LIFT }}
    {...(p as object)}
  />
)

/** A line only offered on approach: hidden at rest, shown while its group is
 *  hovered or holds a keyboard's focus — a reveal a keyboard cannot reach is
 *  one half of the people never see. */
const Reveal = ({ render = 'span', ...p }: SurfaceProps) => (
  <Text
    {...slot('reveal')}
    render={render}
    display={OWN}
    whiteSpace="inherit"
    color={INK}
    opacity={0}
    transition={'opacity var(--duration-fast) var(--ease-in-out)' as never}
    $group-hover={{ opacity: 1 }}
    $group-focusVisible={{ opacity: 1 }}
    $group-focusWithin={{ opacity: 1 }}
    {...(p as object)}
  />
)

export type LatticeProps = Loose<Omit<ViewProps, 'children'>> & {
  /** The pitch of the rule, in px. */
  size?: number
  /** How much of the foreground ink each line takes, 0..1. */
  opacity?: number
}

/** A ruled backdrop, in the foreground ink so it reads on either ground. Two
 *  knobs, the pitch and the strength; everything else — where it sits, what
 *  masks it — is the caller's props. */
const Lattice = ({ size = 30, opacity = 0.05, ...p }: LatticeProps) => {
  const ink = `color-mix(in srgb, var(--foreground) ${opacity * 100}%, transparent)`
  return (
    <View
      {...slot('lattice')}
      aria-hidden
      backgroundImage={`linear-gradient(to right, ${ink} 1px, transparent 1px), linear-gradient(to bottom, ${ink} 1px, transparent 1px)`}
      backgroundSize={`${size}px ${size}px`}
      {...(p as object)}
    />
  )
}

export { Leaf, Cell, Lift, Reveal, Lattice }
