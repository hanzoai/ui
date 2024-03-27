'use client'
import React from 'react'
import { observer } from 'mobx-react-lite'

import { Button, toast, type ButtonSizes } from '@hanzo/ui/primitives'
import { cn } from '@hanzo/ui/util'

import { Icons } from './Icons'
import type { LineItem } from '../types'
import { sendFBEvent, sendGAEvent } from '../util/analytics'

const AddToCartWidget: React.FC<{ 
  item: LineItem
  ghost?: boolean
  disabled?: boolean
  className?: string
  buttonClx?: string
  size?: ButtonSizes
  onQuantityChanged?: (sku: string, oldV: number, newV: number) => void
}> = observer(({
  item,
  ghost=false,
  disabled=false,
  className='',
  buttonClx='',
  size='xs',
  onQuantityChanged
}) => {

  const iconClx = ghost ? 'h-4 w-4 md:h-3 md:w-3 text-muted-3 hover:text-foreground' : 'h-5 w-7 px-1'
  const digitClx = ghost ? 'px-2 md:px-0.5 text-foreground ' : 'sm:px-2 font-bold text-primary-fg '

  if (disabled) {
    return (
      <div className={cn('flex flex-row items-stretch ' + (ghost ? 'bg-transparent  rounded-xl' : 'bg-primary rounded-xl'), className)}>
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
    if (old === 0) {
      toast(`Added ${item.title} to your bag.`)
    }
    else {
      toast(`Changed quantity to ${old + 1} for ${item.title}.`)
    }
    sendGAEvent('add_to_cart', {
      items: [{
        item_id: item.sku,
        item_name: item.title,
        item_category: item.categoryId,
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
    if (old === 1) {
      toast(`Removed ${item.title} from your bag.`)
    }
    else {
      toast(`Changed quantity to ${old - 1} for ${item.title}.`)
    }
    sendGAEvent('remove_from_cart', {
      items: [{
        item_id: item.sku,
        item_name: item.title,
        item_category: item.categoryId,
        price: item.price,
        quantity: item.quantity
      }],
      value: item.price,
      currency: 'USD',
    })
  }

  return ( item.isInCart ? (
    <div className={cn('flex flex-row items-stretch justify-center ' + (ghost ? 'bg-transparent  rounded-xl' : 'bg-primary rounded-xl'), className)}>
      <Button
        aria-label={'Remove a ' + item.title + ' from the cart'}
        size={size}
        variant={ghost ? 'ghost' : 'primary'}
        rounded={ghost ? 'full' : 'xl'}
        className={cn('px-1 lg:min-w-0 lg:px-2  xs:justify-end', buttonClx)}
        key='left'
        onClick={dec}
      >
      {(item.quantity > 1) ? (
        <Icons.minus className={iconClx} aria-hidden='true'/>
      ) : (
        <Icons.trash className={iconClx} aria-hidden='true'/>
      )}
      </Button>
        <div className={'text-sm flex items-center cursor-default xs:px-2 ' + digitClx} >{item.quantity}</div>
      <Button
        aria-label={'Add another ' + item.title + ' to the cart'}
        size={size}
        variant={ghost ? 'ghost' : 'primary'}
        rounded={ghost ? 'full' : 'xl'}
        className={cn('px-1 lg:min-w-0 lg:px-2 xs:justify-start', buttonClx)}
        onClick={inc}
        key='right'
      >
        <Icons.plus className={iconClx} aria-hidden='true'/>
      </Button>
    </div>
  ) : (
    <Button
      aria-label={'Add a ' + item.title + ' to cart'}
      size={size}
      variant='primary'
      rounded='xl'
      className={cn(buttonClx, className)}
      onClick={inc}
    >
      <Icons.plus className='h-5 w-5 mr-1' aria-hidden='true'/>
      <span className='mr-1'>Add</span>
    </Button>
  ))
})

export default AddToCartWidget
