'use client'
import React, { useEffect, useRef } from 'react'
import { reaction, type IReactionDisposer } from 'mobx'
import { observer } from 'mobx-react-lite'

import { Button, buttonVariants } from '@hanzo/ui/primitives'
import { cn, type VariantProps } from '@hanzo/ui/util'

import Icons from './Icons'
import type { LineItem } from '../types'
import { sendFBEvent, sendGAEvent } from '../util/analytics'
import { useCommerceUI } from '..'

const AddToCartWidget: React.FC<{ 
  item: LineItem
  registerAdd?: boolean
  disabled?: boolean
  className?: string
  buttonClx?: string
  variant?: 'minimal' | 'primary' | 'outline'
  onQuantityChanged?: (sku: string, oldV: number, newV: number) => void
}> = observer(({
  item,
  variant='primary',
  registerAdd=true,
  disabled=false,
  className='',
  buttonClx='',
  onQuantityChanged
}) => {

  const ui = useCommerceUI()

  const reactionDisposer = useRef<IReactionDisposer | undefined>(undefined)

  useEffect(() => {
      // Only tell the micro-drawer 
      // if we're not part of the cart ui,
      // or part of the main drawer.
    if (registerAdd && variant !== 'minimal') {
      reactionDisposer.current = reaction(
        () => (item.quantity),
        (quantity: number, previous: number) => {
          ui.itemQuantityChanged(item, quantity, previous)
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

  let iconClx = ghost ? 'h-4 w-4 md:h-3 md:w-3 text-muted-3 ' : 'h-5 w-7 px-1 opacity-70 '
  iconClx += ghost ? 'group-hover:text-foreground' : 'group-hover:opacity-100'

  let digitClx = ghost ? 'px-2 md:px-0.5 ' : 'sm:px-2 font-semibold '
  digitClx += (ghost || outline) ? 'text-foreground ' : 'text-primary-fg '

  if (disabled) {
    return (
      <div className={cn('flex flex-row items-stretch' + ROUNDED_CLX +  (!primary ? 'bg-transparent' : 'bg-primary'), className)}>
        <div className={'text-sm flex items-center cursor-default ' + digitClx} >{item.quantity}</div>
      </div>
    )
  }

  const inc = () => {
    const old = item.quantity
    item.increment()
    if (onQuantityChanged) {
      onQuantityChanged(item.sku, old, old + 1) 
    }
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

  const dec = () => {
    const old = item.quantity
    item.decrement()
    if (onQuantityChanged) {
      onQuantityChanged(item.sku, old, old - 1) 
    }
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
      (ghost ? 'h-8' : 'h-10'),
      ROUNDED_CLX,
      (primary ? 'bg-primary' : 'bg-transparent'), 
      (outline ? 'border border-muted' : ''),
      className
    )}>
      <Button
        aria-label={'Remove a ' + item.title + ' from the cart'}
        size={ghost ? 'xs' : 'default'}
        variant={primary ? 'primary' : 'ghost'}
        rounded={ghost ? 'full' : ROUNDED_VAL}
        className={cn(
          'lg:min-w-0 lg:px-2 grow justify-start group', 
          (ghost ? 'px-1' : 'px-2'), 
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
        <div className={'text-sm grow-0 shrink-0 flex items-center cursor-default xs:px-2 ' + digitClx} >{item.quantity}{ghost ? '' : ' in Bag'}</div>
      <Button
        aria-label={'Add another ' + item.title + ' to the cart'}
        size={ghost ? 'xs' : 'default'}
        variant={primary ? 'primary' : 'ghost'}
        rounded={ghost ? 'full' : ROUNDED_VAL}
        className={cn(
          'lg:min-w-0 lg:px-2 grow justify-end group', 
          (ghost ? 'px-1' : 'px-2'), 
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
      size={ghost ? 'xs' : 'default'}
      variant={variant === 'minimal' ? 'ghost' : (variant as VariantProps<typeof buttonVariants>['variant'])}
      rounded={ROUNDED_VAL}
      className={cn(buttonClx, className)}
      onClick={inc}
    >
      <Icons.plus className='h-5 w-5 mr-1' aria-hidden='true'/>
      <span className='mr-1'>Add</span>
    </Button>
  ))
})

export default AddToCartWidget
