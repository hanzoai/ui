'use client'
import React, { useEffect, useLayoutEffect, useState } from 'react'

import Image from 'next/image'

import type { Dimensions, TShirtSize, TShirtDimensions } from '../../types'
import { constrain, asNum } from '../../util'
import type { Block, VideoBlock } from '../def'
import { VideoPlayer } from '../../primitives'

const VideoBlockComponent: React.FC<{
  block: Block
  className?: string
  usePoster?: boolean
  size?: TShirtSize
  constraint?: Dimensions
}> = ({
  block,
  className='',
  usePoster=false,
  size='md',
  constraint
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
    if (window) {
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
  if (b.sizing?.vh) {
    const ar = asNum(b.dim.md.w) / asNum(b.dim.md.h)
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
      const height = ((b.sizing.vh / 100) * asNum(_dim.h))
      const dim  = {
        h: height,
        w: height * ar
      }
      return ((
        <VideoPlayer 
          className={className} 
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
  const conDim = (constraint ? constrain(dim, constraint) : dim) 
  return usePoster ? (
    <Image src={b.poster!} alt='image' width={conDim.w} height={conDim.h} className={className}/>
  ) : (
    <VideoPlayer 
      className={className} 
      sources={b.sources} 
      width={conDim.w} 
      height={conDim.h} 
      {...b.videoProps} 
    />
  )
}

export default VideoBlockComponent
