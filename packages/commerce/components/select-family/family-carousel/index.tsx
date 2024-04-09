'use client'
import React, { useCallback, useRef } from 'react'

import { cn } from '@hanzo/ui/util'

import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@hanzo/ui/primitives'
import type { Dimensions } from '@hanzo/ui/types'

import type { Family, FamilyCarouselSlideOptions } from '../../../types'

import FamilySlide from './slide'
import {
  SlideState,
  FamilyCarouselState
} from './state'

import { useCommerce } from '../../..'

const FamilyCarousel: React.FC<{
  families: Family[]
  clx?: string
  itemClx?: string
  slideOptions?: FamilyCarouselSlideOptions
  mediaConstraint?: Dimensions
  mobile?: boolean
}> = ({ 
  families,
  clx='',
  itemClx='',
  slideOptions, 
  mediaConstraint={w: 250, h: 250},
  mobile=false,
}) => {

  const cmmc = useCommerce()
  const stateRef = useRef<FamilyCarouselState>(
    new FamilyCarouselState(families, cmmc.setCurrentItem.bind(cmmc))
  )

  const onSelect = useCallback((emblaApi: CarouselApi) => {
    const index = emblaApi.selectedScrollSnap()
    if (index !== -1) {
      stateRef.current.setCurrentFamily(families[index].id)
    }
  }, [stateRef.current])

  return ( 
    <Carousel 
      className={cn('px-2', clx)}
      options={{loop: false}}  
      onCarouselSelect={onSelect} 
    >
      <CarouselContent>
      {families.map((family) => {
        const slideState = stateRef.current.getSlideState(family.id)
        if (!slideState) {
          throw new Error(`FamilyCarousel: no SlideState for family '${family.id}'!`)
        }
        return (
          <CarouselItem key={family.id} className='p-2 flex flex-col justify-center items-center'>
            <FamilySlide 
              family={family}
              selectedItemRef={slideState}
              selectSku={slideState.selectSku.bind(slideState)}
              mediaConstraint={mediaConstraint}
              options={slideOptions}
              mobile={mobile}
              clx={itemClx}
            />
          </CarouselItem>
        )}
      )}
      </CarouselContent>
      <CarouselPrevious className='left-1'/>
      <CarouselNext className='right-1'/>
    </Carousel>
  )
}

export default FamilyCarousel
