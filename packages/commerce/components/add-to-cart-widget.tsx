'use client'
import React, { useEffect, useRef } from 'react'
import { reaction, type IReactionDisposer } from 'mobx'
import { observer } from 'mobx-react-lite'

import { Button, buttonVariants } from '@hanzo/ui/primitives'
import { cn, type VariantProps } from '@hanzo/ui/util'

import Icons from './Icons'
import type { LineItem } from '../types'
import { sendFBEvent, sendGAEvent } from '../util/analytics'

const AddToCartWidget: React.FC<{ 
  item: LineItem
  disabled?: boolean
  className?: string
  buttonClx?: string
  variant?: 'minimal' | 'primary' | 'primary-smaller' | 'outline'
  onQuantityChanged?: (sku: string, oldV: number, newV: number) => void
}> = observer(({
  item,
  variant='primary',
  disabled=false,
  className='',
  buttonClx='',
  onQuantityChanged
}) => {

  const reactionDisposer = useRef<IReactionDisposer | undefined>(undefined)
  useEffect(() => {
    if (onQuantityChanged) {
      reactionDisposer.current = reaction(
        () => (item.quantity),
        (quantity: number, previous: number) => {
          onQuantityChanged(item.sku, quantity, previous)
        }  
      )
    }
    return () => {
      if (reactionDisposer.current) {
        reactionDisposer.current()
      }  
    }
  }, [])

  const ROUNDED_VAL = 'lg'
    // no need to safelist, since its used widely
  const ROUNDED_CLX = ` rounded-${ROUNDED_VAL} `

  const ghost = variant === 'minimal'
  const outline = variant === 'outline'
  const primary = variant === 'primary'
  const priSmaller = variant === 'primary-smaller'

  let iconClx = ghost ? 'h-4 w-4 md:h-3 md:w-3 text-muted-3 ' : (priSmaller ? 'h-4 w-6 px-0.5 opacity-70' : 'h-5 w-7 px-1 opacity-70 ')
  iconClx += ghost ? 'group-hover:text-foreground' : 'group-hover:opacity-100'

  let digitClx = ghost ? 'px-2 md:px-0.5 ' : 'sm:px-2 font-semibold '
  digitClx += (ghost || outline) ? 'text-foreground ' : 'text-primary-fg '

  if (disabled) {
    return (
      <div className={cn('flex flex-row items-stretch' + ROUNDED_CLX +  (!(primary || priSmaller) ? 'bg-transparent' : 'bg-primary'), className)}>
        <div className={'text-sm flex items-center cursor-default ' + digitClx} >{item.quantity}</div>
      </div>
    )
  }

  const inc = (event: React.MouseEvent<HTMLElement>) => {
    item.increment()
    event.stopPropagation() // in case we're part of a larger selection UI
    sendGAEvent('add_to_cart', {
      items: [{
        item_id: item.sku,
        item_name: item.title,
        item_category: item.familyId,
        price: item.price,
        quantity: item.quantity
      }],
      value: item.price,
      currency: 'USD',
    })
    sendFBEvent('AddToCart', {
      content_ids: [item.sku],
      contents: [{
        id: item.sku,
        quantity: item.quantity
      }],
      content_name: item.title,
      value: item.price,
      currency: 'USD',
    })
  }

  const dec = (event: React.MouseEvent<HTMLElement>) => {
    item.decrement()
    event.stopPropagation() // in case we're part of a larger selection UI
    sendGAEvent('remove_from_cart', {
      items: [{
        item_id: item.sku,
        item_name: item.title,
        item_category: item.familyId,
        price: item.price,
        quantity: item.quantity
      }],
      value: item.price,
      currency: 'USD',
    })
  }

  return ( item.isInCart ? (
    <div className={cn(
      'flex flex-row items-stretch justify-between ',
        // should match 'xs' and 'default' button heights
      (ghost || priSmaller ? 'h-8' : 'h-9'),
      ROUNDED_CLX,
      (primary || priSmaller ? 'bg-primary' : 'bg-transparent'), 
      (outline ? 'border border-muted' : ''),
      className
    )}>
      <Button
        aria-label={'Remove a ' + item.title + ' from the cart'}
        size={ghost || priSmaller ? 'xs' : 'default'}
        variant={primary || priSmaller ? 'primary' : 'ghost'}
        rounded={ghost ? 'full' : ROUNDED_VAL}
        className={cn(
          'lg:min-w-0 lg:px-2 grow justify-start group', 
          (ghost || priSmaller ? 'px-1' : 'px-2'), 
          (outline ? 'hover:bg-transparent' : ''),
          buttonClx,
          'h-auto self-stretch' // must be smaller than normal
        )}
        key='left'
        onClick={dec}
      >
      {(item.quantity > 1) ? (
        <Icons.minus className={iconClx} aria-hidden='true'/>
      ) : (
        <Icons.trash className={iconClx} aria-hidden='true'/>
      )}
      </Button>
        <div className={cn(
          'grow-0 shrink-0 flex items-center cursor-default xs:px-2',
          priSmaller || ghost ? 'text-xs' : 'text-sm',
          digitClx
        )}>
          {item.quantity}{ghost ? '' : ' in Bag'}
        </div>
      <Button
        aria-label={'Add another ' + item.title + ' to the cart'}
        size={ghost || priSmaller ? 'xs' : 'default'}

        variant={primary || priSmaller ? 'primary' : 'ghost'}
        rounded={ghost ? 'full' : ROUNDED_VAL}
        className={cn(
          'lg:min-w-0 lg:px-2 grow justify-end group', 
          (ghost || priSmaller ? 'px-1' : 'px-2'), 
          (outline ? 'hover:bg-transparent' : ''),
          buttonClx,
          'h-auto self-stretch' // must be smaller than normal
        )}
        onClick={inc}
        key='right'
      >
        <Icons.plus className={iconClx} aria-hidden='true'/>
      </Button>
    </div>
  ) : (
    <Button
      aria-label={'Add a ' + item.title + ' to cart'}
      size={ghost || priSmaller ? 'xs' : 'default'}
      variant={ghost ? 'ghost' : (primary || priSmaller ? 'primary' : 'outline')}
      rounded={ROUNDED_VAL}
      className={cn(buttonClx, className)}
      onClick={inc}
    >
      <span className='m1-1'>Add</span>
      <Icons.plus className='h-5 w-5 ml-1' aria-hidden='true'/>
    </Button>
  ))
})

export default AddToCartWidget
