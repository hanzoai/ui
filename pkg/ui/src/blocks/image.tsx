'use client'
import { View, YStack } from '@hanzo/gui'
import * as React from 'react'

import { Box } from '../box'
import { cn } from '../core/cn'
import type { Dimensions } from '../types'
import type { ImageBlock } from './def'
import { type BlockComponentProps, fit, has, name } from './spec'

/** How much an unconstrained image shrinks on a phone. */
const PHONE = 0.75

/**
 * An image, sized before it loads.
 *
 * Width and height are always emitted — even when a style overrides them —
 * because they are what lets the browser reserve the right box and not shift
 * the page when the bytes arrive.
 *
 * This renders a plain `<img>`: nothing in this package imports a framework. A
 * host that wants its own optimizing image registers one for this block type —
 * `registerBlockType('image', MyImage)` — which is the same door every other
 * substitution goes through.
 */
export const ImageBlockComponent = ({
  block,
  className,
  agent,
  constrainTo,
}: BlockComponentProps & { constrainTo?: Dimensions }) => {
  if (block.blockType !== 'image') return <>image block required</>
  const { src, alt, dim, props, sizes, fullWidthOnMobile, svgFillClass, specifiers } =
    block as ImageBlock

  const spec = (s: string) => has(specifiers, s)
  const phone = agent === 'phone'
  // The 5.x original read one past the end of the split, so every image without
  // an explicit alt got `undefined` — silently, and only where it mattered.
  const label = alt ?? name(src)

  const size: Record<string, unknown> = {}
  if (props?.fill === undefined) {
    const box = constrainTo ? fit(dim, constrainTo) : dim
    size.width = box.w
    size.height = box.h
  }
  if (sizes) size.sizes = sizes

  if (phone && (spec('mobile-full-width') || fullWidthOnMobile)) {
    return (
      <YStack items="center" width="100%">
        <Box
          tag="img"
          src={src}
          alt={label}
          width={dim.w}
          height={dim.h}
          sizes="100vw"
          style={{ width: '100%', height: 'auto', maxWidth: 420 }}
          className={cn(svgFillClass, className)}
        />
      </YStack>
    )
  }

  if (phone && !spec('mobile-no-scale') && props?.fill === undefined) {
    const box = constrainTo ? fit(dim, constrainTo) : dim
    size.width = box.w * PHONE
    size.height = box.h * PHONE
  }

  const align = spec('right') ? 'self-end' : spec('center') ? 'self-center' : 'self-start'

  if (props?.fill) {
    return (
      <View position="relative" width="100%" height="100%">
        <Box
          tag="img"
          src={src}
          alt={label}
          {...size}
          {...props}
          className={cn(svgFillClass, 'max-w-[70vw] mx-auto', className)}
        />
      </View>
    )
  }

  return (
    <Box
      tag="img"
      src={src}
      alt={label}
      {...size}
      {...props}
      className={cn(align, svgFillClass, 'max-w-[70vw] mx-auto', className)}
    />
  )
}

export default ImageBlockComponent
