'use client'
import React, { useEffect, useRef } from 'react'
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
import { accessItemOptions, formatCurrencyValue } from '../../util'

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
      data-vaul-no-drag 
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

  const {
    showPrice, 
    showQuantity,
    showFamilyInOption,
    buttonType,
    horizButtons,
  } = accessItemOptions(options)

  const showImage = buttonType !== 'text'
  const showText = buttonType !== 'image' 
  const showBoth = buttonType === 'image-and-text' 

  const labelAndPrice = (item : LineItem) => (
    (showFamilyInOption ? (item.familyTitle + ', ' + item.optionLabel) : item.optionLabel) + 
    (showPrice ? ((showFamilyInOption ? ': ' : ', ') + formatCurrencyValue(item.price)) : '')
  )

  const Item: React.FC<{ 
    item: LineItem
    selected: boolean
  }> = observer(({
    item,
    selected
  }) => {
    
    const textClx = (selected) ? 'text-accent' : 'text-muted'
    const cursorClx = (selected) ? 'hover:cursor-default' : 'hover:cursor-pointer' 
    const justifyClx = (showBoth) ?  '' : 'justify-center'
      // If no image, the Label must fill the entire button since it has to be
      // clickable all the way to the border
    const paddingClx = (showImage) ? (scrollable ? 'px-4 py-2' : 'px-2 py-2' ) : '' 
    let bgClx = '' 
    let borderClx = ''
    if (scrollable) {
      borderClx += (selected) ? 'border-foreground border ' : 'border-b border-muted-2 '
    }
    else if (!showImage) {
      borderClx += 'border rounded-lg ' 
      borderClx += (selected) ? 'border-foreground ' : 'border-muted-2 ' 
      bgClx += 'hover:bg-level-2' 
    }

    const outerClx = ['h-10 flex items-center', justifyClx, paddingClx, bgClx, borderClx]

    return (
      <div className={cn(...outerClx, itemClx )}  data-vaul-no-drag >
        <ImageRadioGroupItem 
          item={item} 
          constrainTo={DEFAULT_CONSTRAINT} 
          className={cn(
            cursorClx,
            (scrollable ?  '' : 'border-transparent border-2 data-[state=checked]:border-foreground'),
            showBoth ? 'mr-2' : (showImage ? '' : 'hidden') 
          )}
        />
        <Label htmlFor={item.sku} className={cn(
          showQuantity ? 'flex items-center' : 'block',
          textClx, 
          cursorClx,
          (showImage ? '' : 'self-stretch w-full flex items-center justify-center px-3 py-2'),
          (showText ? '' : 'hidden') 
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
      className={cn( 
        (scrollable ? 'shrink min-h-0 gap-0' : (mobile ? 'gap-3' : 'gap-1')), 
        (horizButtons ? `grid grid-cols-${items.length} gap-1` : 'flex flex-col'),
        (mobile && showText) ? 'min-w-pr-50' : '',
        clx,
      )}
      onValueChange={selectSku}
      value={itemRef.item ? itemRef.item.sku : ''}
      data-vaul-no-drag 
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
