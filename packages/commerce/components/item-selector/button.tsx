'use client'
import React from 'react'
import { observer } from 'mobx-react-lite'

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"

import { 
  Image, 
  Label, 
  RadioGroup, 
  ScrollArea 
} from '@hanzo/ui/primitives'
import { cn } from '@hanzo/ui/util'
import type { Dimensions } from '@hanzo/ui/types'

import type { ItemSelectorProps, LineItem } from '../../types'
import { formatCurrencyValue } from '../../util'

import QuantityIndicator from '../quantity-indicator'

const DEFAULT_CONSTRAINT = {h: 36, w: 72} // // Apple suggest 42px for clickability

const ImageRadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  Omit<React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>, 'value' | 'id'> & {
    item: LineItem,
    constrainTo: Dimensions  
  }
>(({ 
  item,
  constrainTo,
  className, 
  ...props 
}, ref) => {

  const img = item.optionImg ? item.optionImg : item.img

  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
        'overflow-hidden',
        img?.rounded ? `rounded-${img.rounded}` : 'rounded-sm'
      )}
      {...props}
      id={item.sku}
      value={item.sku}
    >
      {img ? (
        <Image def={img} constrainTo={constrainTo} preload className=''/>
      ) : ( // placeholder so things align
        <div style={{height: constrainTo.h, width: constrainTo.w}}/>
      )}
    </RadioGroupPrimitive.Item>
  )
})
ImageRadioGroupItem.displayName = 'ImageRadioGroupItem'

const ButtonItemSelector: React.FC<ItemSelectorProps> = observer(({
  items,
  selectedItemRef: itemRef,
  selectSku,
  clx='',
  itemClx='',
  soleItemClx='',
  scrollable=false,
  mobile=false,
  options={}
}) => {

  const imageButtons = 'imageButtons' in options ? options.imageButtons : false
  const showFamily = 'showFamily' in options ? options.showFamily : false
  const showPrice = 'showPrice' in options ? options.showPrice : true
  const showQuantity = 'showQuantity' in options ? options.showQuantity : false
  const horizButtons = 'horizButtons' in options ? options.horizButtons : false

  const labelAndPrice = (item : LineItem) => (
    (showFamily ? (item.familyTitle + ', ' + item.optionLabel) : item.optionLabel) + 
    (showPrice ? ((showFamily ? ': ' : ', ') + formatCurrencyValue(item.price)) : '')
  )

  const Item: React.FC<{ 
    item: LineItem
    selected: boolean
  }> = observer(({
    item,
    selected
  }) => {
    
    const textClx = (selected) ? 'text-accent ' : 'text-muted'
    const cursorClx = (selected) ? 'hover:cursor-default' : 'hover:cursor-pointer' 
    const justifyClx = (!imageButtons) ? 'justify-center ' : ''
    const paddingClx = (imageButtons) ? (scrollable ? 'px-4' : 'px-2' ) : ''
    let bgClx = '' 
    let borderClx = ''
    if (scrollable) {
      borderClx += (selected) ? 'border-foreground border ' : 'border-b border-muted-2 '
    }
    else if (!imageButtons) {
      borderClx += 'border rounded-lg ' 
      borderClx += (selected) ? 'border-foreground ' : 'border-muted-2 ' 
      bgClx += 'hover:bg-level-2' 
    }

    const outerClx = ['h-10 py-2 flex items-center', justifyClx, paddingClx, bgClx, borderClx]

    return (
      <div className={cn(...outerClx, itemClx )}>
        <ImageRadioGroupItem 
          item={item} 
          constrainTo={DEFAULT_CONSTRAINT} 
          className={cn(
            cursorClx,
            (scrollable ?  '' : 'border-transparent border-2 data-[state=checked]:border-foreground'),
            imageButtons ? 'mr-2' : 'hidden'
          )}
        />
        <Label htmlFor={item.sku} className={cn(
          showQuantity ? 'flex items-center' : 'block',
          textClx, 
          cursorClx,
        )}>
          <div className={showQuantity ? 'grow' : ''}>{labelAndPrice(item)}</div>
          {showQuantity && (
            <QuantityIndicator 
              item={item} 
              clx='grow-0 shrink-0 h-[20px] ml-2' 
              iconClx={selected ? 'fill-foreground' : 'fill-muted'}
              digitClx='font-semibold text-primary-fg leading-none font-sans text-xxs' 
            />
          )}
        </Label>
      </div>
    )
  })
 
  return items.length > 1 ? (
    <RadioGroup
      className={cn('flex', 
        (scrollable ? 'shrink min-h-0 gap-0' : (mobile ? 'gap-3' : 'gap-1')), 
        (horizButtons ? 'flex-row gap-0' : 'flex-col'),
        (mobile && !imageButtons) ? 'min-w-pr-50' : '',
        clx,
      )}
      onValueChange={selectSku}
      value={itemRef.item ? itemRef.item.sku : ''}
    >
    {scrollable ? (
      <ScrollArea className='mt-2 w-full h-full py-0 border border-muted-2' data-vaul-no-drag>
      {items.map((item) => (
        <Item item={item} selected={itemRef.item?.sku === item.sku} key={item.sku}/>
      ))}
      </ScrollArea>
    ) : (<>
      {items.map((item) => (
        <Item item={item} selected={itemRef.item?.sku === item.sku} key={item.sku}/>
      ))}
    </>)}
    </RadioGroup>
  ) : (
    <div className={cn(showQuantity ? 'flex items-center' : 'block', soleItemClx )}>
      <div className={showQuantity ? 'grow' : ''}>
        {labelAndPrice(items[0])}
      </div>
        {showQuantity && (
          <QuantityIndicator item={items[0]} clx='grow-0 shrink-0 font-semibold text-sm leading-none px-2' />
        )}
    </div>
  )
})

export default ButtonItemSelector
