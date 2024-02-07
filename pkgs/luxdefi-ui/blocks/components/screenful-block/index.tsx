import React from 'react'
import dynamic from 'next/dynamic'

import type { Block, ScreenfulBlock, VideoBlock } from '../../def'
import { cn } from '../../../util'
import { ApplyTypography } from '../../../primitives'

import Poster from './poster-background'
import Content from './content'
const Video = dynamic(() => (import('./video-background')), {ssr: false, loading: () => (<></>)})

const ScreenfulComponent: React.FC<{
  block: Block
  agent?: string
  initialInView?: boolean
  snapTile?: boolean
  className?: string
}> = ({
  block,
  agent,
  initialInView=false,
  snapTile=false,
  className=''
}) => {

  if (block.blockType !== 'screenful') {
    return <>screenful block required</>
  }
  const b = block as ScreenfulBlock 

  const hasBannerVideo = (): boolean => (!!b.banner && (typeof b.banner === 'object'))

  const contentclx = 'z-10 absolute left-0 right-0  top-0 bottom-0 xl:mx-auto max-w-screen-xl'
  const tileHeight = (agent === 'desktop') ? 'h-full ' : 'h-[100svh] '

  return (
    <section className={cn('h-[100vh]', (snapTile ? 'snap-start snap-always' : ''), className)}>
      <ApplyTypography className={tileHeight + 'w-full flex flex-row justify-center self-stretch'} >
        <Poster banner={b.banner}>
        {hasBannerVideo() && (
          <Video 
            block={b.banner! as VideoBlock} 
            className='z-0 absolute top-0 left-0 bottom-0 right-0' 
            initialInView={initialInView}
          />
        )}
        <Content block={b} agent={agent} className={contentclx} />
      </Poster>
      </ApplyTypography>
    </section>
  )
}

export default ScreenfulComponent
