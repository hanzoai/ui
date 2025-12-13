'use client'

import React from 'react'
import dynamic from 'next/dynamic'

import type { Block, ScreenfulBlock, VideoBlock } from '../../def'
import { containsToken, cn } from '../../../util'
import { ApplyTypography } from '../../../primitives/index-common'

import Poster from './poster-background'
import Content from './content'
const Video = dynamic(() => import('./video-background'), { ssr: false, loading: () => <></> })

const ScreenfulComponent: React.FC<{
  block: Block
  agent?: string
  initialInView?: boolean
  snapTile?: boolean
  clx?: string
  contentClx?: string
  bottom?: React.ReactNode
}> = ({
  block,
  agent,
  initialInView=false,
  snapTile=false,
  clx='',
  contentClx='',
  bottom
}) => {

  if (block.blockType !== 'screenful') {
    return <>screenful block required</>
  }
  const b = block as ScreenfulBlock 

  const hasBannerVideo = (): boolean => (!!b.banner && (typeof b.banner === 'object'))

  const tileHeight = (agent === 'desktop') ? 'h-full ' : 'h-[100svh] '

  const specified = (s: string) => (containsToken(b.specifiers, s))
  const narrowGutters = specified('narrow-gutters') // eg, for a table object that is large
  const noGutters = specified('no-gutters')
  const fullScreenWidth = specified('full-screen-width')
  const vertCenter = specified('vert-center') // at the main level, it seems only useful w one column
  const oneColumn = b.contentColumns.length === 1

    // content wrapper clx:
    // [
    //    positioning, 
    //    p&m, 
    //    p&m-modifiers
    // ]
  const cwclx = [
    'xl:mx-auto overflow-y-hidden h-full',
    fullScreenWidth ? '' : 'max-w-screen-xl',
      // desktop header: 80px / pt-20
      // mobile header: 44px / pt-11  
    narrowGutters ? 
      'px-6 lg:px-8 2xl:px-2 pb-4 lg:pb-6 xl:pb-8 ' + (snapTile  ? 'pt-15 md:pt-26 lg:pt-28 ' : '') // otherwise assume there is a Main
      : 
      noGutters ? 
        'px-0 pb-0 ' + (snapTile  ? 'pt-11 lg:pt-20 ' : '') // otherwise assume there is a Main
        : 
        'px-[8vw] xl:px-[1vw] pb-[8vh] pt-[calc(44px+4vh)] md:pt-[calc(80px+6vh)] ',

    (agent && agent !== 'desktop') ? 'pt-15 sm:pt-17 pb-0 px-3 sm:px-8' : '' 
  ]

  return (
    <section {...((b.anchorId) ? {id: b.anchorId} : {})} className={cn(
      snapTile ? 'snap-start snap-always h-[100vh]' : 'min-h-screen', 
      bottom ? 'flex flex-col' : '',
      clx
    )}>
      <ApplyTypography className={cn(
        'w-full flex flex-row justify-center self-stretch', 
        snapTile ? tileHeight : '',
        bottom ? 'grow' : ''
      )}>
        <Poster banner={b.banner}>
        {hasBannerVideo() && (
          <Video 
            block={b.banner! as VideoBlock} 
            className='absolute top-0 left-0 bottom-0 right-0' 
            initialInView={initialInView}
          />
        )}
        <div className={cn(
            ...cwclx,
            snapTile ? 'absolute left-0 right-0 top-0 bottom-0 ' : 'flex min-h-screen w-full',
            contentClx,
              // TODO :aa py-0 breaks padding for header!  Investigate why I would have done this!
            vertCenter ? 'self-center ' + (oneColumn ? '!py-0' : '' ) : ''
          )}
        >
          <Content block={b} agent={agent}  className='w-full'/>
          {b.footer}
        </div>
      </Poster>
      </ApplyTypography>
      {bottom}
    </section>
  )
}

export default ScreenfulComponent
