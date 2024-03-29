'use client'
import React from 'react'
import { observer } from 'mobx-react-lite'

import { cn } from '@hanzo/ui/util'
import { Skeleton } from '@hanzo/ui/primitives'

import type { ItemSelector, LineItem } from '../../types'

import AddToCartWidget from '../add-to-cart-widget'
import CategoryItemRadioSelector from '../category-item-radio-selector'
import CategoryItemScrollSelector from '../category-item-scroll-selector'
import { formatCurrencyValue } from '../../util'

const SelectCategoryItemCard: React.FC<React.HTMLAttributes<HTMLDivElement> & ItemSelector & {
  isLoading?: boolean
  mobile?: boolean
  noTitle?: boolean
  onQuantityChanged?: (sku: string, oldV: number, newV: number) => void
}> = /* NOT observer */({
  category,
  selectedItemRef: selItemRef,
  selectSku,
  className, 
  isLoading = false, 
  mobile = false, 
  noTitle = false,
  onQuantityChanged,
  ...props
}) => {

  const soleOption = category.products.length === 1

  const SelectProductComp: React.FC<{ className?: string }> = ({ 
    className = '' 
  }) => {

    const mobilePicker = (mobile || category.products.length > 6) 
    if (soleOption) {
      const item = category.products[0] as LineItem
      return (
        <div className={cn('flex flex-col justify-center items-center ' + (mobilePicker ? 'h-[180px] ' : 'h-auto min-h-24'), className)}>
          <p className='text-lg text-center font-semibold'>{item.titleAsOption + ', ' + formatCurrencyValue(item.price)}</p>
        </div>
      )
    }

    return (
      <div /* id='CV_AVAIL_AMOUNTS' */ className={cn(
        'sm:w-pr-80 sm:mx-auto md:w-full  flex flex-col justify-start items-center',
        className
      )}>
        {!noTitle && (<div className={'h-[1px] bg-muted-3 ' + (mobilePicker ?  'w-pr-55' :  'w-pr-60') } /> )}
        {mobilePicker ? (
          <CategoryItemScrollSelector
            category={category}
            selectedItemRef={selItemRef}  
            selectSku={selectSku}
            itemClx='h-10 border-b px-4'
            outerClx='min-w-pr-80 h-[180px]' // 80% of 65% parent
          />
        ) : (
          <CategoryItemRadioSelector 
            category={category}
            selectedItemRef={selItemRef}  
            selectSku={selectSku}
            groupClx='mt-2'
            showQuantity={false}
            itemClx='flex flex-row gap-2.5 items-center'
          />
        )}
      </div>
    )
  }

  const AddToCartComp: React.FC<{ className?: string }> = observer(({ className = '' }) => (
      // TODO disable if nothing selected
    (selItemRef.item && !isLoading) && (
      <AddToCartWidget 
        size='default' 
        item={selItemRef.item}
        onQuantityChanged={onQuantityChanged} 
        className={cn('lg:min-w-[160px] lg:mx-auto', className)}
      />
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
        'w-full flex flex-col justify-between items-center gap-5 py-pr-6', 
        className
      )} 
      {...props}
    >
      {!noTitle && (<TitleArea className='grow pt-3 mb-0' />)}
      <SelectProductComp className='w-pr-65' />
      <AddToCartComp className='w-pr-65' />
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
