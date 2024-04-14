'use client'
import React from 'react'
import { observer } from 'mobx-react-lite'

import { cn } from '@hanzo/ui/util'
import { Skeleton } from '@hanzo/ui/primitives'

import type { ItemSelector, LineItem } from '../../types'

import AddToCartWidget from './add-to-cart-widget'
import { ButtonItemSelector } from '../item-selector'
import { formatCurrencyValue } from '../../util'

const SelectFamilyItemCard: React.FC<React.HTMLAttributes<HTMLDivElement> & ItemSelector & {
  isLoading?: boolean
  mobile?: boolean
  title?: string
  onQuantityChanged?: (sku: string, oldV: number, newV: number) => void
}> = /* NOT observer */({
  items,
  selectedItemRef: selItemRef,
  selectSku,
  className, 
  isLoading = false, 
  mobile = false, 
  title,
  onQuantityChanged,
  ...props
}) => {

  const soleOption = items.length === 1

  const SelectProductComp: React.FC<{ className?: string }> = ({ 
    className = '' 
  }) => {

    const mobilePicker = (mobile || items.length > 6) 
    if (soleOption) {
      const item = items[0] as LineItem
      return (
        <div className={cn('flex flex-col justify-center items-center ' + (mobilePicker ? 'h-[180px] ' : 'h-auto min-h-24'), className)}>
          <p className='text-lg text-center font-semibold'>{item.optionLabel + ', ' + formatCurrencyValue(item.price)}</p>
        </div>
      )
    }

    return (
      <div /* id='CV_AVAIL_AMOUNTS' */ className={cn(
        'sm:w-pr-80 sm:mx-auto md:w-full  flex flex-col justify-start items-center',
        className
      )}>
        {title && (<div className={'h-[1px] bg-muted-3 ' + (mobilePicker ?  'w-pr-55' :  'w-pr-60') } /> )}
        <ButtonItemSelector 
          items={items}
          selectedItemRef={selItemRef}  
          selectSku={selectSku}
          clx='mt-2'
          scrollable={false}
          itemClx='flex flex-row gap-2.5 items-center'
        />
      </div>
    )
  }

  const AddToCartComp: React.FC<{ className?: string }> = observer(({ className = '' }) => (
      // TODO disable if nothing selected
    (selItemRef.item && !isLoading) && (
      <AddToCartWidget 
        item={selItemRef.item}
        onQuantityChanged={onQuantityChanged} 
        className={cn('lg:min-w-[160px] lg:mx-auto', className)}
      />
    ) 
  ))

  const TitleArea: React.FC<{ className?: string }> = observer(({ className = '' }) => (

    isLoading ? (<Skeleton className={'h-8 w-full ' + className} />) : (

      <div className={cn('text-center flex flex-col justify-start items-center', className)}>
        <p className='font-heading text-center'>{title}</p>
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
      {title && (<TitleArea className='grow pt-3 mb-0' />)}
      <SelectProductComp className='w-pr-65' />
      <AddToCartComp className='w-pr-65' />
    </div>
  ) : (
    <div className={cn('', className)} {...props}>
      {title && (<TitleArea className='' />)}
      <div className='flex flex-col justify-start items-center gap-4'>
        <SelectProductComp />
        <AddToCartComp className='' />
      </div>
    </div>
  )
}

export default SelectFamilyItemCard
