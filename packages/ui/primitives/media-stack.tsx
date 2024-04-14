'use client'
import React from 'react'

import Spline from '@splinetool/react-spline'

import { cn, constrain, spreadToTransform } from '../util'
import type { MediaStackDef, Dimensions } from '../types'

import Image from './image'
import VideoPlayer from './video-player'

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
            // // !aspect-[12/10] 
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
          minHeight: dim.h, // prevents layout jumps
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
