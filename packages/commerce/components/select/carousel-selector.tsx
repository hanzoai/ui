'use client'
import React, { useCallback, useEffect, useRef } from 'react'
import { reaction } from 'mobx'
import { observer } from 'mobx-react-lite'

import { cn } from '@hanzo/ui/util'
import ItemMedia from '../item/item-media'

import {
  type CarouselOptionsType,
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  ApplyTypography
} from '@hanzo/ui/primitives'

import type { ItemSelectorProps, LineItem } from '../../types'
import { formatCurrencyValue } from '../../util'

interface CarouselItemSelectorPropsExt {
  constrainTo: {w: number, h: number}
  options?: CarouselOptionsType 
    /** Do not show Category and / or Item title and Price */
  imageOnly?: boolean
}
  
const CarouselItemSelector: React.FC<ItemSelectorProps> = observer(({ 
  items,
  selectSku,
  selectedItemRef: itemRef,
  scrollList, // ignored
  clx='',
  itemClx='',
  showCategory=false,
  ext={
    options: {loop: true},
    constrainTo: {w: 250, h: 250},
    imageOnly: false 
  } satisfies CarouselItemSelectorPropsExt
}) => {

  const { options, constrainTo, imageOnly} = ext

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

  const ItemInfo: React.FC<{
    item: LineItem
    clx?: string
  }> = ({
    item,
    clx
  }) => (
    <ApplyTypography className={cn(clx, 'flex flex-col items-center !gap-2 [&>*]:!m-0')}>
      {showCategory && (<h4>{item.categoryTitle}</h4>)}
      <p>{item.optionLabel}</p>
      <p>{formatCurrencyValue(item.price)}</p>
    </ApplyTypography>
  )

  return ( 
    <Carousel options={options} className={cn('w-full px-2', clx)} onSelect={onSelect} setApi={setApi}>
      <CarouselContent>
      {items.map((item, index) => (
        <CarouselItem key={index} className={cn('p-2 flex flex-col justify-center items-center', itemClx)}>
          <ItemMedia item={item} constrainTo={constrainTo} clx='' />
          {!imageOnly && (<ItemInfo item={item} clx=''/>)}
        </CarouselItem>
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
