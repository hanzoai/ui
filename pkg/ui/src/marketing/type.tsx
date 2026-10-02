'use client'

/**
 * Line — one line of type on the marketing ramp.
 *
 * The size/leading pairs are gui's own rungs (`$1`…`$10`), which resolve to the
 * same `--text-*` custom properties @hanzo/design publishes, so a site that sets
 * its type scale or density through @hanzo/appearance moves every marketing block
 * with it. Ink is one of five tones, never a colour.
 *
 * `render` picks the element: a heading is a heading only when the element says
 * so, and a page with no headings passes every visual check.
 */
import { Text, type TextProps } from '@hanzo/gui'
import type { ReactNode } from 'react'

import { slot } from '../backends/gui/slot'
import { useHost } from './host'
import type { Host, Loose } from './loose'

const SIZE = {
  xs: { fontSize: '$1', lineHeight: '$1' },
  sm: { fontSize: '$2', lineHeight: '$2' },
  base: { fontSize: '$3', lineHeight: '$3' },
  lg: { fontSize: '$4', lineHeight: '$4' },
  xl: { fontSize: '$6', lineHeight: '$6' },
  x2: { fontSize: '$7', lineHeight: '$7' },
  x3: { fontSize: '$8', lineHeight: '$8' },
  x4: { fontSize: '$10', lineHeight: '$10' },
} as const

const TONE = {
  plain: '$ink',
  muted: '$soft',
  soft: '$quiet',
  dim: '$faint',
} as const

export type LineSize = keyof typeof SIZE
export type LineTone = keyof typeof TONE

export type LineProps = Loose<Omit<TextProps, 'children' | 'render' | 'color'>> &
  Host & {
    size?: LineSize
    tone?: LineTone
    /** An ink of its own, in place of a tone. */
    color?: string
    weight?: '400' | '500' | '600' | '700'
    render?: TextProps['render']
    align?: 'center' | 'right'
  }

const Line = ({ size, tone = 'plain', weight, align, render, children, ...p }: LineProps) => {
  const pair = size ? SIZE[size] : undefined
  const host = useHost(render, p.href, 'span')
  return (
    <Text
      render={host}
      fontSize={pair?.fontSize}
      lineHeight={pair?.lineHeight}
      fontWeight={weight}
      color={TONE[tone]}
      text={align}
      {...(p as object)}
    >
      {children}
    </Text>
  )
}

export { Line }

/**
 * The type a page's own copy is set in: the page heading, the section heading,
 * the small caps line above one and the paragraph under it, and the category
 * line under the promise. One rung of @hanzo/design's ramp each, said once here
 * so a call site passes words and spacing, never type.
 *
 * Each is a block of running text: `display="revert-layer"` and
 * `whiteSpace="inherit"` undo gui Text's inline, pre-wrap default, which is
 * right for a label and wrong for a paragraph — the element is the box the
 * document makes it, and takes the white space of the page it sits in. `render` picks the element and defaults to the one the role
 * is — a page heading is an `<h1>` — and accepts an element, so a link or a
 * motion host can carry the role: `render={<motion.p {...reveal} />}`.
 *
 * A stated `fontSize` is the whole size: the display and claim ramps step up at
 * 640 and 1024, and a breakpoint would otherwise re-grow a size the caller set.
 *
 * Hierarchy is by scale, not weight: the headings are book weight (497, the
 * Zen cut that reads as regular at display size) with leading that lets them
 * breathe, and one ink — the heading owns its colour.
 */
export type RoleProps = Loose<Omit<TextProps, 'render' | 'children'>> &
  Host & {
    render?: TextProps['render']
  }

/** The element's own box — a heading's or a paragraph's block, a span's line —
 *  which is what the document gives it under gui Text's `inline`. */
const BLOCK = { display: 'revert-layer' as 'block', whiteSpace: 'inherit' } as const

/** How a heading and a paragraph break: evened out, and no lone last word. A
 *  web-only prop, typed once here. */
const BALANCE = { textWrap: 'balance' } as object
const PRETTY = { textWrap: 'pretty' } as object

/** The page heading: three rungs of one ramp, 32 / 40 / 52. */
const Display = ({ render = 'h1', ...p }: RoleProps) => (
  <Text
    {...slot('display')}
    render={render}
    {...BLOCK}
    fontFamily="$heading"
    fontSize="$10"
    fontWeight={'497' as never}
    lineHeight={'1.19' as never}
    letterSpacing={'-0.012em' as never}
    color="var(--foreground)"
    {...BALANCE}
    {...(p.fontSize === undefined ? { $sm: { fontSize: '$11' }, $lg: { fontSize: 'var(--text-6xl)' as never } } : null)}
    {...(p as object)}
  />
)

/** The section heading: one size at every width, so it never grows into a page
 *  heading. `quiet` is one rung down, for a heading under another section's. */
const Title = ({ render = 'h2', quiet = false, ...p }: RoleProps & { quiet?: boolean }) => (
  <Text
    {...slot('title')}
    render={render}
    {...BLOCK}
    fontFamily="$heading"
    fontSize={quiet ? '$7' : '$8'}
    fontWeight={'497' as never}
    lineHeight={(quiet ? '1.2' : '1.22') as never}
    letterSpacing={'-0.01em' as never}
    color="var(--foreground)"
    {...BALANCE}
    {...(p as object)}
  />
)

/** The small caps line above a heading. */
const Eyebrow = ({ render = 'p', ...p }: RoleProps) => (
  <Text
    {...slot('eyebrow')}
    render={render}
    {...BLOCK}
    fontSize="$2"
    fontWeight="500"
    lineHeight={'calc(1.25 / 0.875)' as never}
    letterSpacing={'0.2em' as never}
    textTransform="uppercase"
    color="var(--muted-foreground)"
    {...(p as object)}
  />
)

/** The paragraph under a heading. */
const Lede = ({ render = 'p', ...p }: RoleProps) => (
  <Text
    {...slot('lede')}
    render={render}
    {...BLOCK}
    fontSize="$3"
    lineHeight={'1.65' as never}
    letterSpacing={0}
    color="var(--muted-foreground)"
    {...PRETTY}
    {...(p as object)}
  />
)

/** The category line under the promise: read second, so bigger and brighter than
 *  a lede, a rung up at 640 the way the display above it steps. */
const Claim = ({ render = 'p', ...p }: RoleProps) => (
  <Text
    {...slot('claim')}
    render={render}
    {...BLOCK}
    fontSize="$7"
    lineHeight={'var(--leading-snug)' as never}
    color="var(--text-secondary)"
    {...(p.fontSize === undefined ? { $sm: { fontSize: '$8' } } : null)}
    {...(p as object)}
  />
)

export { Display, Title, Eyebrow, Lede, Claim }
