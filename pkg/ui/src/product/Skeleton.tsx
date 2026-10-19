'use client'

/**
 * Skeleton — the honest "loading", never fabricated content.
 *
 * The product layer's spelling of the ONE skeleton (`backends/gui/skeleton.tsx`):
 * a block by default, a line of the `$1` size tall unless told otherwise, and
 * `Skeleton.Text` for a paragraph. The paint, the corner and the sweep are the
 * core's; this only states the defaults a product surface reaches for.
 *
 * It renders a BLOCK, not a spinner: a placeholder the size and shape of the
 * thing that is coming keeps the layout from jumping when the data lands. Give
 * it the dimensions of the real content — that is the whole discipline.
 *
 *   <Skeleton height="$2" width={180} />   // a line of text
 *   <Skeleton height={120} rounded="$4" /> // a card
 *   <Skeleton.Text lines={3} />            // a paragraph
 */
import { YStack } from '@hanzo/gui'
import { Skeleton as Core, type SkeletonProps as CoreProps } from '../backends/gui/skeleton'

export type SkeletonProps = Omit<CoreProps, 'layout'>

function Block({ height = '$1', ...props }: SkeletonProps) {
  return <Core layout="block" height={height} {...props} />
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
