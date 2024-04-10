'use client'
import React from 'react'

import Spline from '@splinetool/react-spline'

import { cn, constrain } from '../util'
import { type Block, type VideoBlock, VideoBlockComponent } from '../blocks'
import type { MediaStackDef, Dimensions } from '../types'

import Image from './image'
import VideoPlayer from './video-player'

const MediaStack: React.FC<{
  media: MediaStackDef
  constrainTo?: Dimensions
  clx?: string
}> = ({
  media: {img, video, animation},
  constrainTo: cnst = {w: 250, h: 250},
  clx=''
}) => {


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
          height: cnst.h
        }}
      />
    )
  } 
  if (video) {

    const dim = constrain(video.dim.md, cnst)
    return (
      <VideoPlayer 
        className={cn('mx-auto', clx)} 
        sources={video.sources} 
        width={dim.w} 
        height={dim.h} 
        style={{
          minHeight: dim.h // prevents layout jumps
        }}
        {...video.videoProps} 
      />
    )
  } 
  return img ? ( 
    <Image
      def={img}
      constrainTo={cnst} 
      className={cn('mx-auto', clx)}
    />
  ) : (
    <div style={{width: cnst.w, height: cnst.h}} className={cn('bg-level-2', clx)} />
  )

}

export default MediaStack
