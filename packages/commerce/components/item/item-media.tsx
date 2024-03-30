import React from 'react'

import Spline from '@splinetool/react-spline'

import type { Dimensions } from '@hanzo/ui/types'
import { cn } from '@hanzo/ui/util'

import {
  VideoBlockComponent,
  ImageBlockComponent,
  type ImageBlock,
  type Block,
  type VideoBlock
} from '@hanzo/ui/blocks'
import type { LineItem } from '../../types'

const ItemMedia: React.FC<{
  item: LineItem
  constrainTo?: Dimensions
  clx?: string
}> = ({
  item,
  constrainTo: cnst = {w: 250, h: 250},
  clx=''
}) => {

  const {title, img, video, animation} = item
    // Order of precedence: 3D > MP4 > Image
  return animation ? ( 
    <Spline
      scene={animation}
      className={cn(clx, 'pointer-events-none')} 
      style={{
          // // !aspect-[12/10] 
        width: (6/5 * (typeof cnst.h === 'number' ? cnst.h as number : parseInt(cnst.h as string)) ),
        height: cnst.h
      }}
    />
  ) : video ? (
    <VideoBlockComponent
      constraint={cnst}
      block={{blockType: 'video', ...video} satisfies VideoBlock as Block}
      className={clx}
    />
  ) : (
    <ImageBlockComponent
      block={{
        blockType: 'image',
        src: img ?? '',
        alt: title + ' image',
        dim: cnst
      } satisfies ImageBlock as Block} 
      className={cn('m-auto', clx)}
    />
  )
}

export default ItemMedia
