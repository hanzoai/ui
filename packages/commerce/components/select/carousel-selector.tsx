import React from 'react'

import Spline from '@splinetool/react-spline'

import type { Dimensions } from '@hanzo/ui/types'
import { cn } from '@hanzo/ui/util'
import ItemMedia from '../item/item-media'

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

import type { ItemSelectorProps } from '../../types'

interface CarouselItemSelectorPropsExt {
  constrainTo: Dimensions
  options?: CarouselOptionsType 
  noSelection?: boolean // "display only" mode
}
  
const CarouselItemSelector: React.FC<ItemSelectorProps> = ({ 
  items,
  clx='',
  itemClx='',
  ext={
    options: {},
    constrainTo: {w: 250, h: 250} 
  } satisfies CarouselItemSelectorPropsExt
}) => {

  const { options, constrainTo} = ext

  return ( 
    <Carousel options={options} className={cn('px-2', clx)} >
      <CarouselContent>
      {items.map((item, index) => (
        <CarouselItem key={index} className={cn('p-2 flex flex-row justify-center items-center', itemClx)}>
          <ItemMedia item={item} constrainTo={constrainTo} clx='' />
        </CarouselItem>
      ))}
      </CarouselContent>
      <CarouselPrevious className='left-1'/>
      <CarouselNext className='right-1'/>
    </Carousel>
  )
}

export {
  type CarouselItemSelectorPropsExt,
  CarouselItemSelector as default 
}
