import React from 'react'
import dynamic from 'next/dynamic'

import type { Block, ScreenfulBlock, VideoBlock } from '../../def'
import { containsToken, cn } from '../../../util'
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

  const tileHeight = (agent === 'desktop') ? 'h-full ' : 'h-[100svh] '

  const specified = (s: string) => (containsToken(b.specifiers, s))
  const narrowGutters = specified('narrow-gutters') // eg, for a table object that is large

    // content wrapper clx:
    // [
    //    positioning, 
    //    p&m, 
    //    p&m-modifiers
    // ]
  const cwclx = [
    'z-10 absolute left-0 right-0  top-0 bottom-0 xl:mx-auto max-w-screen-xl overflow-y-hidden ',
      // desktop header: 80px / pt-20
      // mobile header: 44px / pt-11  
    narrowGutters ? 
      'px-6 lg:px-8 2xl:px-2 pb-6 pt-15 md:pt-26 lg:pt-28 ' 
      : 
      'px-[8vw] xl:px-[1vw] pb-[8vh] pt-[calc(44px+3vh)] md:pt-[calc(80px+6vh)] ',

    (agent && agent !== 'desktop') ? 'pt-15 sm:pt-17 pb-0 px-3 sm:px-8' : '' 
  ]

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
        <div className={cn(...cwclx)} >
          <Content block={b} agent={agent}  className='w-full'/>
          {b.footer}
        </div>
      </Poster>
      </ApplyTypography>
    </section>
  )
}

export default ScreenfulComponent
