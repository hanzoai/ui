'use client'

/**
 * Skeleton — the honest "loading", never fabricated content.
 *
 * The block and its highlight are gui props; the sweep is `data-motion="shimmer"`
 * in `styles/motion.css`. Before this, every surface hand-rolled a grey `<div>`
 * and picked its own radius. This is that div, once, sized in the same `$` space
 * as the rest of the package.
 *
 * It renders a BLOCK, not a spinner: a placeholder the size and shape of the
 * thing that is coming keeps the layout from jumping when the data lands. Give
 * it the dimensions of the real content — that is the whole discipline.
 *
 *   <Skeleton height="$2" width={180} />   // a line of text
 *   <Skeleton height={120} rounded="$4" /> // a card
 *   <Skeleton.Text lines={3} />            // a paragraph
 */
import { View, YStack } from '@hanzo/gui'
import type { ComponentProps } from 'react'

export type SkeletonProps = ComponentProps<typeof View>

function Block({ height = '$1', rounded = '$2', ...props }: SkeletonProps) {
  return (
    <View
      data-motion="shimmer"
      height={height}
      rounded={rounded}
      bg="var(--color3, rgba(128, 128, 128, 0.14))"
      backgroundImage="linear-gradient(90deg, transparent 0%, var(--color4, rgba(128, 128, 128, 0.22)) 50%, transparent 100%)"
      backgroundSize="160px 100%"
      backgroundRepeat="no-repeat"
      // A placeholder is scenery, not content: a screen reader should hear the
      // real thing when it arrives, not "loading" in the middle of the page.
      aria-hidden
      {...props}
    />
  )
}

export type SkeletonTextProps = SkeletonProps & {
  /** How many lines to stand in for. */
  lines?: number
}

/**
 * A paragraph's worth of lines. The last one is short, because a real paragraph
 * ends mid-line and a stack of equal bars reads as a table.
 */
function SkeletonText({ lines = 3, gap = '$2', ...props }: SkeletonTextProps) {
  return (
    <YStack gap={gap} width="100%">
      {Array.from({ length: Math.max(1, lines) }, (_, i) => (
        <Block key={i} width={i === lines - 1 ? '60%' : '100%'} {...props} />
      ))}
    </YStack>
  )
}

export const Skeleton = Object.assign(Block, { Text: SkeletonText })
