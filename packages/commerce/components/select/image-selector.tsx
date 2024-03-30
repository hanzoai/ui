'use client'
import React from 'react'
import Image from 'next/image'
import { observer } from 'mobx-react-lite'

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Label, RadioGroup, RadioGroupItem } from '@hanzo/ui/primitives'
import type { ItemSelectorProps, LineItem } from '../../types'
import { formatCurrencyValue } from '../../util'
import { cn } from '@hanzo/ui/util'
import type { Dimensions } from '@hanzo/ui/types'

const ImageRadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  Omit<React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>, 'value' | 'id'> & {
    item: LineItem,
    imgSizePx: number  
  }
>(({ 
  item,
  imgSizePx,
  className, 
  ...props 
}, ref) => {

  let dim: Dimensions 
  if (item.imgAR) {
    if (item.imgAR >= 1) {
      dim = {
        w: imgSizePx,
        h: imgSizePx / item.imgAR
      }
    }
    else {
      dim = {
        w: imgSizePx * item.imgAR,
        h: imgSizePx
      }
    }
  }
  else {
    dim = {
      w: imgSizePx,
      h: imgSizePx
    }
  }

  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
      id={item.sku}
      value={item.sku}
    >
      {!!item.img ? (
        <Image src={item.img} alt={item.title + ' image'} height={dim.h} width={dim.w} className=''/>
      ) : ( // placeholder so things align
        <div style={{height: dim.h, width: dim.w}}/>
      )}
    </RadioGroupPrimitive.Item>
  )
})
ImageRadioGroupItem.displayName = 'ImageRadioGroupItem'

const ImageItemSelector: React.FC<ItemSelectorProps> = observer(({
  items,
  selectedItemRef: itemRef,
  selectSku,
  clx='',
  itemClx='',
  soleItemClx='',
  showPrice=true,
  showQuantity=true
}) => {

  const Choice: React.FC<{
    item: LineItem
    className?: string
  }> = ({
    item,
    className=''
  }) => (
    <div className={cn('flex items-center mb-1', className, itemClx)}>
      <ImageRadioGroupItem item={item} imgSizePx={40} className='mr-2 border-2 border-transparent rounded-sm data-[state=checked]:border-foreground'/>
      <Label htmlFor={item.sku}>{item.titleAsOption + (showPrice ? (', ' + formatCurrencyValue(item.price)) : '')}</Label>
    </div>
  )

  const SoleChoice: React.FC<{
    item: LineItem
    className?: string
  }> = ({
    item,
    className=''
  }) => (
    <div className={cn(className, soleItemClx)}>
      {item.titleAsOption + (showPrice ? (', ' + formatCurrencyValue(item.price)) : '')}
    </div>
  )

  return items.length > 1 ? (
    <RadioGroup
      className={cn('gap-0', showQuantity ? 'table' : '', clx)}
      onValueChange={selectSku}
      value={itemRef.item ? itemRef.item.sku : ''}
    >
    {items.map((item) => (showQuantity ? (
      <div className='table-row' key={item.sku}>
        <Choice item={item} className='table-cell pr-2 align-text-top pb-3'/>
        <div className='table-cell font-semibold text-sm leading-none align-text-top pb-3'>{ item.quantity > 0 ? `(${item.quantity})` : ' '}</div>
      </div>
    ) : (
      <Choice item={item} className='mb-3'  key={item.sku}/>
    )))}
    </RadioGroup>
  ) : (
    <SoleChoice item={items[0]} className=''/>
  )
})

export default ImageItemSelector
