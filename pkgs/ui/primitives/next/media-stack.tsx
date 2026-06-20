'use client'
import React from 'react'

import { cn, constrain, spreadToTransform } from '../../util'
import type { MediaStackDef, Dimensions } from '../../types'

import Image from './image'
import VideoPlayer from '../video-player'

const MediaStack: React.FC<{
  media: MediaStackDef
  constrainTo?: Dimensions
  clx?: string
}> = ({
  media,
  constrainTo: cnst = {w: 250, h: 250},
  clx=''
}) => {
  const {img, video, mediaTransform} = media

  const transform = mediaTransform ?? {}

  // Order of precedence: MP4 > Image
  // For 3D/Spline support, use @hanzo/ui/spline MediaStack instead
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
