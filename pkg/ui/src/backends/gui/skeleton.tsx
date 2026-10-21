'use client'

/**
 * Skeleton — the shape of content that has not arrived. ONE implementation:
 * `@hanzo/ui`'s `Skeleton` is this, and `@hanzo/ui/product`'s `Skeleton` (with
 * `Skeleton.Text`) is this with its own defaults.
 *
 * It is a box with a highlight sweeping across it and nothing else, so the SIZE
 * is the caller's to state and should match what will land there. A skeleton
 * that is not the size of its content is worse than none: the page reflows when
 * the real thing appears, which is the jump the skeleton existed to prevent.
 *
 * After the source kit's Skeleton (MIT, NOTICE): the base is the hover rung, the
 * highlight a faint glass band, 4px corners, a 1.5s sweep (`--duration-loop`,
 * stopped under reduced motion), height presets xs 13 / s 16 / m 24 / l 32 /
 * xl 40, and two layouts — `inline` takes a line box of the text around it
 * (it holds a zero-width non-joiner, so it is a line tall with no height
 * given), `block` is a box of its own. The highlight is `--glass` rather than
 * the panel rung: the source kit's is 2% black on light and 3% white on dark, and
 * the panel rung is a SOLID step that sits darker than the hover rung in the
 * dark theme, which would sweep a shadow instead of a light.
 *
 * Hidden from assistive technology: a placeholder is scenery, and the content
 * is what should be read when it lands.
 *
 * Class notation is still read (`<Skeleton className="h-4 w-32" />`), the way
 * `Box` reads it, so call sites written against the Box version keep their
 * sizes; a class it does not know stays a class.
 */
import { SizableText, YStack } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { tw, type ClassValue } from '../../tw'
import { slot } from './slot'

/** The height presets, px. */
export const SKELETON_HEIGHT = { xs: 13, s: 16, m: 24, l: 32, xl: 40 } as const

export type SkeletonSize = keyof typeof SKELETON_HEIGHT

export type SkeletonProps = Omit<ComponentProps<typeof YStack>, 'children' | 'size'> & {
  /** A height preset; a `height` given beside it wins. */
  size?: SkeletonSize
  /** `inline` (default) is a line of the surrounding text; `block` is a box. */
  layout?: 'inline' | 'block'
  /** The sweep; off, a still block. Off under reduced motion regardless. */
  animated?: boolean
  className?: ClassValue
}

/** The band that sweeps: transparent, the glass light, transparent. */
const BAND = 'linear-gradient(90deg, transparent 0%, var(--glass, rgba(128, 128, 128, 0.08)) 50%, transparent 100%)'

export function Skeleton({ size, layout = 'inline', animated = true, className, ...props }: SkeletonProps) {
  const { props: read, rest } = tw(className)
  const height = size ? SKELETON_HEIGHT[size] : layout === 'block' ? '1em' : undefined
  return (
    <YStack
      {...slot('skeleton')}
      aria-hidden
      data-layout={layout}
      // `shimmer` is styles/motion.css's sweep; a skeleton runs it on the loop
      // duration (the rule keyed on `data-slot="skeleton"` there).
      data-motion={animated ? 'shimmer' : undefined}
      display={layout === 'inline' ? 'inline-flex' : 'flex'}
      width="100%"
      {...(height === undefined ? null : { height })}
      rounded="$xs"
      bg="$hover"
      backgroundImage={animated ? BAND : undefined}
      backgroundSize="160px 100%"
      backgroundRepeat="no-repeat"
      overflow="hidden"
      {...(read as object)}
      {...(rest ? { className: rest } : null)}
      {...props}
    >
      {layout === 'inline' && height === undefined && !('height' in props) && !('height' in read) ? (
        <SizableText size="$2" aria-hidden>
          {'‌'}
        </SizableText>
      ) : null}
    </YStack>
  )
}
