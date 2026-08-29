
/**
 * MediaStack — one subject, in whatever media the content happens to have.
 *
 * A product has a photograph. Later it has a video, and later still an animated
 * one, and no consumer should have to learn about that: the content grows a
 * field and the stack renders the richest thing it can play. Callers say what
 * BOX the media must fit in, never what size to draw it — so a grid of cards
 * lines up whatever the source resolutions happen to be.
 *
 * Fitting is `contain`, computed here rather than left to CSS `object-fit`,
 * because the element must be the fitted size for the layout around it to
 * reserve the right space before the bytes arrive. `object-fit` letterboxes
 * INSIDE a box that is already the wrong shape.
 */
import * as React from 'react'
import { Image } from '@hanzo/gui'

import { Box } from '../../box'
import { cn } from '../../core/cn'
import type { Dimensions, MediaStackDef } from '../../types'
import { VideoPlayer } from './video'

/**
 * The largest `dim` fits inside `to` at its own aspect ratio, times `scale`.
 *
 * `scale` is a fraction of the CONSTRAINT rather than a CSS transform: a scaled
 * image occupies the space it draws in, so a swatch at 0.25 leaves room around
 * it instead of overlapping its neighbours the way `transform: scale` would.
 */
export const fit = (dim: Dimensions, to: Dimensions, scale = 1): Dimensions => {
  if (!dim?.w || !dim?.h) return to
  const r = Math.min(to.w / dim.w, to.h / dim.h) * scale
  return { w: Math.round(dim.w * r), h: Math.round(dim.h * r) }
}

export type MediaStackProps = Omit<React.ComponentProps<typeof Box>, 'children'> & {
  media: MediaStackDef
  /** The box the media must fit inside. */
  constrainTo: Dimensions
}

export const MediaStack = ({ media, constrainTo, className, ...props }: MediaStackProps) => {
  const scale = media?.mediaTransform?.scale ?? 1
  const { offsetX = 0, offsetY = 0 } = media?.mediaTransform ?? {}

  // Richest first, and richest that can be PLAYED here: an animation is a url
  // to a document needing a player this does not carry, so a stack holding one
  // falls to its video or its still rather than rendering an empty box.
  const video = media?.video
  const img = media?.img

  const inner = (() => {
    if (video?.sources?.length) {
      const d = fit(video.dim?.md ?? constrainTo, constrainTo, scale)
      return (
        <VideoPlayer
          width={d.w}
          height={d.h}
          poster={video.poster}
          sources={video.sources}
          {...video.videoProps}
        />
      )
    }
    const still = img
    if (!still?.src) return null
    const d = fit(still.dim ?? constrainTo, constrainTo, scale)
    return (
      <Image
        // `src`, not react-native's `source`. gui's Image renders a real <img>
        // on web and forwards what it does not recognise straight to the DOM,
        // so a `source` object arrives as the attribute `source="[object
        // Object]"` and the element has no url at all — it renders, it measures,
        // and it shows nothing.
        src={still.src}
        width={d.w}
        height={d.h}
        // The short filename is a far better default than nothing: a decorative
        // image should say so with `alt=""`, and content that forgot the field
        // at least announces WHICH image it is.
        alt={still.alt ?? still.src.split('/').pop()}
        className={img?.rounded}
      />
    )
  })()

  return (
    <Box
      className={cn('grid place-items-center', className)}
      style={{
        width: constrainTo.w,
        height: constrainTo.h,
        ...(offsetX || offsetY
          ? { transform: `translate(${offsetX}px, ${offsetY}px)` }
          : null),
      }}
      {...props}
    >
      {inner}
    </Box>
  )
}
