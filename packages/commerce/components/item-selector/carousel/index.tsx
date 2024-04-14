'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { reaction } from 'mobx'
import { observer } from 'mobx-react-lite'

import { cn } from '@hanzo/ui/util'
import type { Dimensions } from '@hanzo/ui/types'

import {
  ApplyTypography,
  type CarouselOptions,
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  MediaStack,
} from '@hanzo/ui/primitives'

import type { ItemSelectorProps, LineItem } from '../../../types'
import { formatCurrencyValue, accessItemOptions } from '../../../util'

import QuantityIndicator from '../../quantity-indicator'
import ItemCarouselSlider from './slider'

const DEFAULT_CONSTRAINT = {w: 250, h: 250}

interface CarouselItemSelectorPropsExt {
  constrainTo: Dimensions
  options?: CarouselOptions 
    /** Do not show Family and / or Item title and Price */
  imageOnly?: boolean
}

const ItemSlide: React.FC<{
  item: LineItem,
  constrainTo: Dimensions
  clx?: string
}> = ({
  item,
  constrainTo,
  clx=''
}) => (
  <CarouselItem className={cn('p-2 flex flex-col justify-center items-center', clx)}>
    <MediaStack media={item} constrainTo={constrainTo} clx='my-4' />
  </CarouselItem>
) 

const CarouselItemSelector: React.FC<ItemSelectorProps> = observer(({ 
  items,
  selectSku,
  selectedItemRef: itemRef,
  clx='',
  itemClx='',
  options={},
  ext={
    options: {loop: true},
    constrainTo: DEFAULT_CONSTRAINT,
    imageOnly: false 
  } satisfies CarouselItemSelectorPropsExt
}) => {

  const {
    showPrice, 
    showQuantity,
    showFamilyInOption,
    showByline,
    showSlider,
  } = accessItemOptions(options)
    
  const elbaApiRef = useRef<CarouselApi | undefined>(undefined)
  const scrollToRef = useRef<((index: number) => void) | undefined>(undefined)
  const dontRespondRef = useRef<boolean>(false)

  const setApi = (api: CarouselApi) => {elbaApiRef.current = api}
  const setScrollTo = (scrollTo: (index: number) => void) => { scrollToRef.current = scrollTo}

  const carouselOptions = 'options' in ext ? ext.options : undefined
  const constrainTo = 'constrainTo' in ext ? ext.constrainTo : DEFAULT_CONSTRAINT
  const imageOnly = 'imageOnly' in ext ? ext.imageOnly : false

  const onSelect = useCallback((emblaApi: CarouselApi) => {
    if (dontRespondRef.current) {
      dontRespondRef.current = false
      return
    }
    const index = emblaApi.selectedScrollSnap()
    if (index !== -1) {
      selectSku(items[index].sku)
      if (scrollToRef.current) {
        scrollToRef.current(index)
      }
    }
    dontRespondRef.current = false
  }, [scrollToRef.current ])

  useEffect(() => {
    return reaction(
      () => (itemRef.item),
      (item) => {
        if (elbaApiRef.current) {
          const index = items.findIndex((el) => (el.sku === item?.sku))  
          if (index !== -1) {
            dontRespondRef.current = true
            elbaApiRef.current.scrollTo(index) 
          }
        }
      }  
    )
  }, [])

  const optionLabel = () => (
    showFamilyInOption ? 
      (itemRef.item?.familyTitle + ', ' + itemRef.item?.optionLabel) 
      : 
      itemRef.item?.optionLabel 
  )

  const debugBorder = (c: 'r' | 'g' | 'b'): string => {
     return ''

    switch (c) {
      case 'r': return ' border border-[#ffaaaa] '
      case 'g': return ' border border-[#aaffaa] '
      case 'b': return ' border border-[#aaaaff] '
    }
  }

  const onScrollIndexChange = (index: number) => {
    dontRespondRef.current = true
    selectSku(items![index].sku)
    elbaApiRef.current?.scrollTo(index) 
  }

  return ( 
    <div className={cn('w-full flex flex-col items-center', clx)}>
      <Carousel 
        options={showSlider ? {...carouselOptions, loop: false} : carouselOptions } 
        className={'w-full px-2' + debugBorder('r')} 
        onCarouselSelect={onSelect} 
        setApi={setApi}
      >
        <CarouselContent>
        {items.map((item) => (
          <ItemSlide key={item.sku} item={item} constrainTo={constrainTo} clx={itemClx} />
        ))}
        </CarouselContent>
        {!showSlider && (<>
          <CarouselPrevious className='left-1'/>
          <CarouselNext className='right-1'/>
        </>)}
      </Carousel>
     
      {(!imageOnly && itemRef.item) && (<>
        <ApplyTypography className='flex flex-col items-center [&>*]:!m-0 !gap-1 '>
          <div className={
            'flex items-center gap-1 [&>*]:!m-0 ' + debugBorder('g') + 
            (showFamilyInOption ? 'flex-col' : 'flex-row')
          }>
            <h6 className='font-semibold'>
              {optionLabel() + (showPrice && !showFamilyInOption ? ',' : '')}
            </h6>
            <div className={
              'flex items-center gap-1 [&>*]:!m-0 flex-row ' +  debugBorder('b') +  
              (showFamilyInOption ? 'w-full justify-between' : '')
            }>
              {showPrice && (<p>{formatCurrencyValue(itemRef.item.price)}</p>)}
              {showQuantity && (
                <QuantityIndicator 
                  item={itemRef.item} 
                  clx='h-[22px] ml-4' 
                  iconClx='fill-foreground'
                  digitClx='not-typography font-semibold text-primary-fg leading-none font-sans text-xs' 
                />
              )}
            </div>
          </div>
          {showByline && itemRef.item.byline && (<p>{itemRef.item.byline}</p>)}
        </ApplyTypography>
        {showSlider && (
          <ItemCarouselSlider 
            clx='mt-5 w-[320px]' 
            numStops={items.length}  
            setScrollTo={setScrollTo}
            onIndexChange={onScrollIndexChange}
          />
        )}
      </>)}
    </div>
  )
})

export {
  type CarouselItemSelectorPropsExt,
  CarouselItemSelector as default 
}
