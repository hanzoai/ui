'use client'
import React, { useCallback, useEffect, useRef } from 'react'
import { reaction } from 'mobx'
import { observer } from 'mobx-react-lite'

import { cn } from '@hanzo/ui/util'
import type { Dimensions } from '@hanzo/ui/types'

import {
  type CarouselOptions,
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  ApplyTypography,
  MediaStack
} from '@hanzo/ui/primitives'

import type { ItemSelectorProps, LineItem } from '../../types'
import { formatCurrencyValue } from '../../util'

import QuantityIndicator from '../quantity-indicator'

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
  imageOnly: boolean
  showFamily: boolean
  showPrice: boolean
  showQuantity: boolean
  clx?: string
}> = ({
  item,
  constrainTo,
  showFamily,
  imageOnly,
  showPrice,
  showQuantity,
  clx=''
}) => {

  return (
    <CarouselItem className={cn('p-2 flex flex-col justify-center items-center', clx)}>
      {!imageOnly && (
        <ApplyTypography className='flex flex-col items-center !gap-2 [&>*]:!m-0'>
          {showFamily && (<h4>{item.familyTitle}</h4>)}
          <h6>{item.optionLabel}</h6>
          {item.byline && (<p>{item.byline}</p>)}
        </ApplyTypography>
      )}
      <MediaStack media={item} constrainTo={constrainTo} clx='my-4' />
      {!imageOnly && (showPrice || showQuantity) && (
        <ApplyTypography className='flex flex-row items-center !gap-2 [&>*]:!m-0'>
          {showPrice && (<p>{formatCurrencyValue(item.price)}</p>)}
          {showQuantity && (
            <QuantityIndicator 
              item={item} 
              clx='h-[26px] ml-1' 
              iconClx='fill-foreground'
              digitClx='not-typography font-semibold text-primary-fg leading-none font-sans text-xs' 
            />
          )}
        </ApplyTypography>
      )}
    </CarouselItem>
  ) 
}

const CarouselItemSelector: React.FC<ItemSelectorProps> = observer(({ 
  items,
  selectSku,
  selectedItemRef: itemRef,
  scrollable, // ignored
  clx='',
  itemClx='',
  options={},
  ext={
    options: {loop: true},
    constrainTo: DEFAULT_CONSTRAINT,
    imageOnly: false 
  } satisfies CarouselItemSelectorPropsExt
}) => {

  const showFamily = 'showFamily' in options ? options.showFamily! : false
  const showPrice = 'showPrice' in options ? options.showPrice! : true
  const showQuantity = 'showQuantity' in options ? options.showQuantity! : false

  const carouselOptions = 'options' in ext ? ext.options : undefined
  const constrainTo = 'constrainTo' in ext ? ext.constrainTo : DEFAULT_CONSTRAINT
  const imageOnly = 'imageOnly' in ext ? ext.imageOnly : false

  const elbaApiRef = useRef<CarouselApi | undefined>(undefined)
  const dontRespondRef = useRef<boolean>(false)

  const setApi = (api: CarouselApi) => {elbaApiRef.current = api}

  const onSelect = useCallback((emblaApi: CarouselApi) => {
    if (dontRespondRef.current) {
      dontRespondRef.current = false
      return
    }
    const index = emblaApi.selectedScrollSnap()
    if (index !== -1) {
      selectSku(items[index].sku)
    }
    dontRespondRef.current = false
  }, [])

  useEffect(() => {
    return reaction(
      () => ({item: itemRef.item}),
      ({item}) => {
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

  return ( 
    <Carousel options={carouselOptions} className={cn('w-full px-2', clx)} onCarouselSelect={onSelect} setApi={setApi}>
      <CarouselContent>
      {items.map((item) => (
        <ItemSlide 
          key={item.sku} 
          item={item}
          {...{
            showFamily,
            showPrice,
            showQuantity,
            constrainTo,
            imageOnly
          }}
          clx={itemClx}
        />
      ))}
      </CarouselContent>
      <CarouselPrevious className='left-1'/>
      <CarouselNext className='right-1'/>
    </Carousel>
  )
})

export {
  type CarouselItemSelectorPropsExt,
  CarouselItemSelector as default 
}
