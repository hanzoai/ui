'use client'
import React, { useEffect, useLayoutEffect, useState } from 'react'

import Image from 'next/image'

import type { Dimensions, TShirtSize, TShirtDimensions } from '../../types'
import { constrain, asNum, cn } from '../../util'
import type { VideoBlock } from '../def'
import { VideoPlayer } from '../../primitives/index-blocks'

import type BlockComponentProps from './block-component-props'

const VideoBlockComponent: React.FC<BlockComponentProps & {
  usePoster?: boolean
  size?: TShirtSize
  constrainTo?: Dimensions
}> = ({
  block,
  className='',
  agent,
  usePoster=false,
  size='md',
  constrainTo
}) => {

  const [_dim, setDim] = useState<Dimensions | undefined>(undefined)

  const onResize = () => { 
    setDim({
      w: window.innerWidth,
      h: window.innerHeight
    }) 
  } 

  const windowDefined = typeof window !== 'undefined'

  useEffect(() => { 
    if (window && agent === 'desktop') {
      window.addEventListener('resize', onResize) 
      return () => window.removeEventListener('resize', onResize) 
    }
  }, [windowDefined]) 

  useLayoutEffect(() => { 
    onResize() 
  }, [])


  if (block.blockType !== 'video') {
    return <>video block required</>
  }

  const b = block as VideoBlock
  const ar = b.dim.md.w / b.dim.md.h
  if (agent === 'phone') {
    if (b.sizing?.mobile?.vw) {
      // serverside, or at least while the video is loading,
      // generate the css for the correctly sized poster image
      if (!_dim) {
        const width = `${b.sizing.mobile.vw}vw`
        return <div className='dummy-div' style={{
          maxWidth: '100%',
          maxHeight: '100%',
          width,
          height: `calc(${width}/${ar})`,
          backgroundImage: `url(${b.poster!})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat', 
        }} />
      }
      else {
        const width = ((b.sizing.mobile.vw / 100) * _dim.w)
        const dim  = {
          h: width / ar,
          w: width
        }
        return ((
          <VideoPlayer 
            className={cn('mx-auto', className)} 
            sources={b.sources} 
            width={dim.w} 
            height={dim.h} 
            {...b.videoProps} 
          />
        ))
      }
    }
  }
  else if (b.sizing?.vh) {
      // serverside, generate the css for the correctly sized poster image
    if (!_dim) {
      const height = `${b.sizing.vh}vh`
      return <div className='dummy-div' style={{
        maxWidth: '100%',
        maxHeight: '100%',
        height: height,
        width: `calc(${height}*${ar})`,
        backgroundImage: `url(${b.poster!})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat', 
      }} />
    }
    else {

      const height = ((b.sizing.vh / 100) * _dim.h)
      const dim  = {
        h: height,
        w: height * ar
      }
      return ((
        <VideoPlayer 
          className={cn('mx-auto', className)} 
          sources={b.sources} 
          width={dim.w} 
          height={dim.h} 
          {...b.videoProps} 
        />
      ))
    }
  }
  
  const videoDims = b.dim as TShirtDimensions
  const dim = ((size && size in videoDims) ? videoDims[size] : videoDims.md) as Dimensions
  const conDim = (constrainTo ? constrain(dim, constrainTo) : dim) 
  return usePoster ? (
    <Image src={b.poster!} alt='image' width={conDim.w} height={conDim.h} className={className}/>
  ) : (
    <VideoPlayer 
      className={cn('mx-auto', className)} 
      sources={b.sources} 
      width={conDim.w} 
      height={conDim.h} 
      {...b.videoProps} 
    />
  )
}

export default VideoBlockComponent
