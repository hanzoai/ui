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

export type LineProps = Omit<TextProps, 'children' | 'render' | 'color'> & {
  size?: LineSize
  tone?: LineTone
  weight?: '400' | '500' | '600' | '700'
  render?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div' | 'li' | 'blockquote' | 'cite'
  align?: 'center' | 'right'
  children?: ReactNode
}

const Line = ({ size, tone = 'plain', weight, align, render, children, ...p }: LineProps) => {
  const pair = size ? SIZE[size] : undefined
  return (
    <Text
      render={render}
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
