'use client'
import React from 'react'
import { observer } from 'mobx-react-lite'

import { Button, type ButtonSizes } from '@hanzo/ui/primitives'
import { cn } from '@hanzo/ui/util'

import { Icons } from './Icons'
import type { LineItem } from '../types'

const AddToCartWidget: React.FC<{ 
  item: LineItem
  ghost?: boolean
  disabled?: boolean
  className?: string
  buttonClx?: string
  isMobile?: boolean
  wide?: boolean
  size?: ButtonSizes
}> = observer(({
  item,
  ghost=false,
  disabled=false,
  className='',
  buttonClx='',
  size='xs'
}) => {

  const iconClx = ghost ? 'h-4 w-4 md:h-3 md:w-3 text-muted-3 hover:text-foreground' : 'h-5 w-7 px-1'
  const digitClx = ghost ? 'px-2 md:px-0.5' : 'sm:px-2 font-bold '

  if (disabled) {
    return (
      <div className={cn('flex flex-row items-stretch ' + (ghost ? 'bg-transparent  rounded-xl' : 'bg-secondary rounded-xl'), className)}>
        <div className={'text-sm flex items-center cursor-default ' + digitClx} >{item.quantity}</div>
      </div>
    )
  }

  return ( item.isInCart ? (
    <div className={cn('flex flex-row items-stretch justify-center ' + (ghost ? 'bg-transparent  rounded-xl' : 'bg-secondary rounded-xl'), className)}>
      <Button
        aria-label={'Remove a ' + item.title + ' from the cart'}
        size={size}
        variant={ghost ? 'ghost' : 'secondary'}
        rounded={ghost ? 'full' : 'xl'}
        className={cn('px-1 lg:min-w-0 lg:px-2  xs:justify-end', buttonClx)}
        key='left'
        onClick={item.decrement.bind(item)}
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
        variant={ghost ? 'ghost' : 'secondary'}
        rounded={ghost ? 'full' : 'xl'}
        className={cn('px-1 lg:min-w-0 lg:px-2 xs:justify-start', buttonClx)}
        onClick={item.increment.bind(item)}
        key='right'
      >
        <Icons.plus className={iconClx} aria-hidden='true'/>
      </Button>
    </div>
  ) : (
    <Button
      aria-label={'Add a ' + item.title + ' to cart'}
      size={size}
      variant='secondary'
      rounded='xl'
      className={cn(buttonClx, className)}
      onClick={item.increment.bind(item)}
    >
      <Icons.plus className='h-5 w-5 mr-1' aria-hidden='true'/>
      <span className='mr-1'>Add</span>
    </Button>
  ))
})

export default AddToCartWidget
