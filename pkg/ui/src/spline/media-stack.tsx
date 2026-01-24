'use client'
import React from 'react'
import Spline from '@splinetool/react-spline'

import { cn, constrain, spreadToTransform } from '../../util'
import type { MediaStackDef, Dimensions } from '../../types'

import Image from '../../primitives/next/image'
import VideoPlayer from '../../primitives/video-player'

/**
 * MediaStack with Spline 3D support
 * Requires: npm install @splinetool/react-spline
 *
 * For apps that don't need 3D, use the base MediaStack from @hanzo/ui instead
 */
const MediaStack: React.FC<{
  media: MediaStackDef
  constrainTo?: Dimensions
  clx?: string
}> = ({
  media,
  constrainTo: cnst = {w: 250, h: 250},
  clx=''
}) => {
  const {img, video, animation, mediaTransform} = media

  const transform = mediaTransform ?? {}

  // Order of precedence: 3D > MP4 > Image
  if (animation) {
    return (
      <Spline
        scene={animation}
        className={cn(clx, 'pointer-events-none')}
        data-vaul-no-drag
        style={{
          width: (6/5 * (typeof cnst.h === 'number' ? cnst.h as number : parseInt(cnst.h as string)) ),
          height: cnst.h,
          ...spreadToTransform(transform)
        }}
      />
    )
  }
  if (video) {
    const dim = constrain(video.dim.md, cnst)
    return (
      <VideoPlayer
        className={clx}
        sources={video.sources}
        width={dim.w}
        height={dim.h}
        style={{
          minHeight: dim.h,
          ...spreadToTransform(transform)
        }}
        {...video.videoProps}
      />
    )
  }
  return img ? (
    <Image
      def={img}
      constrainTo={cnst}
      className={clx}
      transform={transform}
    />
  ) : (
    <div style={{width: cnst.w, height: cnst.h}} className={cn('bg-level-2', clx)} />
  )
}

export default MediaStack
