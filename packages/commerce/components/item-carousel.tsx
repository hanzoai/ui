import React from 'react'

import Spline from '@splinetool/react-spline'

import { cn } from '@hanzo/ui/util'

import {
  type CarouselOptionsType,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext
} from '@hanzo/ui/primitives'

import {
  VideoBlockComponent,
  ImageBlockComponent,
  type ImageBlock,
  type Block,
  type VideoBlock
} from '@hanzo/ui/blocks'

import type { LineItem } from '../types'
import type { Dimensions } from '@hanzo/ui/types'

  // Order of precedence of visuals: 3D > MP4 > Image
const ItemCarousel: React.FC<{
  items: LineItem[]
  constrainTo: Dimensions
  options?: CarouselOptionsType 
  className?: string
  itemClx?: string  
}> = ({ 
  items,
  options,
  className='',
  constrainTo,
  itemClx=''
}) => ( 
  // className: 'w-full max-w-sm mx-auto 
  // itemClx:  'flex aspect-square items-center justify-center '
  <Carousel options={options} className={cn('px-2', className)} >
    <CarouselContent>
    {items.map(({title, img, video, animation}, index) => (
      <CarouselItem key={index} className={cn('p-2 flex flex-row justify-center items-center', itemClx)}>
      {animation ? (
        <Spline
          scene={animation}
          className='pointer-events-none' // !aspect-[12/10] 
          style={{
            width: (6/5 * (typeof constrainTo.h === 'number' ? constrainTo.h as number : parseInt(constrainTo.h as string)) ),
            height: constrainTo.h
          }}
        />
      ) : video ? (
        <VideoBlockComponent
          constraint={constrainTo}
          block={{blockType: 'video', ...video} satisfies VideoBlock as Block}
        />
      ) : (
        <ImageBlockComponent
          block={{
            blockType: 'image',
            src: img ?? '',
            alt: title + ' image',
            dim: constrainTo
          } satisfies ImageBlock as Block} 
          className='m-auto'
        />
      )}
      </CarouselItem>
    ))}
    </CarouselContent>
    <CarouselPrevious className='left-1'/>
    <CarouselNext className='right-1'/>
  </Carousel>
)

export default ItemCarousel
