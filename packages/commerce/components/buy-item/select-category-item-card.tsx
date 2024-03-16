'use client'
import React from 'react'
import { observer } from 'mobx-react-lite'

import { cn } from '@hanzo/ui/util'
import { Skeleton } from '@hanzo/ui/primitives'

import type { ItemSelector, LineItem } from '../../types'

import AddToCartWidget from '../add-to-cart-widget'
import CategoryItemRadioSelector from '../category-item-radio-selector'
import CategoryItemIOSWheelSelector from '../category-item-ios-wheel-selector'
import { formatPrice } from '../../util'

const SelectCategoryItemCard: React.FC<React.HTMLAttributes<HTMLDivElement> & ItemSelector & {
  isLoading?: boolean
  mobile?: boolean
  noTitle?: boolean
}> = /* NOT observer */({
  category,
  selectedItemRef: selItemRef,
  selectSku,
  className, 
  isLoading = false, 
  mobile = false, 
  noTitle = false,
  ...props
}) => {

  const soleOption = category.products.length === 1

  const SelectProductComp: React.FC<{ className?: string }> = ({ className = '' }) => {

    if (soleOption) {
      const item = category.products[0] as LineItem
      return (
        <p >{item.titleAsOption + ', ' + formatPrice(item.price) + (item.quantity > 0 ? `(${item.quantity})` : '')}</p>
      )
    }
    const mobilePicker = (mobile && category.products.length > 6) 

    return (
      <div /* id='CV_AVAIL_AMOUNTS' */ className={cn(
        'sm:w-pr-80 sm:mx-auto md:w-full  flex flex-col justify-start items-center',
        className
      )}>
        {!noTitle && (<div className={'h-[1px] bg-muted-3 ' + (mobilePicker ?  'w-pr-55' :  'w-pr-60') } /> )}
        {mobilePicker ? (
          <CategoryItemIOSWheelSelector
            category={category}
            selectedItemRef={selItemRef}  
            selectSku={selectSku}
            height={180}
            itemHeight={30}
            outerClx='mb-4'
          />
        ) : (
          <CategoryItemRadioSelector 
            category={category}
            selectedItemRef={selItemRef}  
            selectSku={selectSku}
            groupClx='mt-2'
            itemClx='flex flex-row gap-2.5 items-center'
          />
        )}
      </div>
    )
  }

  const AddToCartComp: React.FC<{ className?: string }> = observer(({ className = '' }) => (
      // TODO disable if nothing selected
    (selItemRef.item && !isLoading) && (
      <AddToCartWidget size='default' item={selItemRef.item} className={cn('lg:min-w-[160px] lg:mx-auto', className)}/>
    ) 
  ))

  const TitleArea: React.FC<{ className?: string }> = observer(({ className = '' }) => (

    isLoading ? (<Skeleton className={'h-8 w-full ' + className} />) : (

      <div className={cn('text-center flex flex-col justify-start items-center', className)}>
        <p className='font-nav text-center'>{category.title}</p>
      </div>

  )))

  return mobile ? (
    <div /* id='CV_OUTER' */ 
      className={cn(
        'w-full h-[calc(100svh-96px)] max-h-[700px] flex flex-col justify-between ' + 
        'items-stretch gap-[4vh] mt-[2vh] pb-[6vh]', 
        className
      )} 
      {...props}
    >
      {!noTitle && (<TitleArea className='grow pt-3 mb-0' />)}
      <SelectProductComp className='mb-[3vh]' />
      <AddToCartComp className='w-pr-70 mx-auto' />
    </div>
  ) : (
    <div className={cn('', className)} {...props}>
      {!noTitle && (<TitleArea className='' />)}
      <div className='flex flex-col justify-start items-center gap-4'>
        <SelectProductComp />
        <AddToCartComp className='' />
      </div>
    </div>
  )
}

export default SelectCategoryItemCard
