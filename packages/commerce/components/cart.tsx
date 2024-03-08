'use client'
import React, { useState, type PropsWithChildren } from 'react'
import { observer } from 'mobx-react-lite'

import { Button } from '@hanzo/ui/primitives'
import { cn } from '@hanzo/ui/util'

import { useCommerce } from '../service/context'
import { formatPrice } from '../util'

import CartLineItem from './cart-line-item'
import { Checkout } from '.'

const Cart: React.FC<PropsWithChildren & {
  className?: string
  isMobile?: boolean,
  hideCheckout?: boolean
}> = observer(({
    /** Children is the heading area. */
  children,
  className='',
  isMobile=false,
  hideCheckout=false
}) => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const cmmc = useCommerce()

  return (
    <div className={cn('border p-4 rounded-lg', className)}>
      {children}
      <div className='mt-2 w-full'>
        {!!children && <div className='h-[1px] w-pr-80 mb-4 mx-auto bg-muted-3'/>}
        {cmmc.cartItems.length === 0 ? (
          <p className='text-center mt-4'>No items in cart</p>
        ) : (<>
          {cmmc.cartItems.map((item, i) => (
            <CartLineItem isMobile={isMobile} item={item} key={item.sku} className='mb-2 md:mb-3'/>
          ))}
          <p className='mt-6 text-right border-t pt-1'>TOTAL: <span className='font-semibold'>{cmmc.cartTotal === 0 ? '0' : formatPrice(cmmc.cartTotal)}</span></p>
        </>)}
      </div>
      {!hideCheckout && (
        <>
          {cmmc.cartItems.length > 0 && (
            <Button size='lg' variant='secondary' rounded='lg' className='mt-12 mx-auto' onClick={() => setIsCheckoutOpen(!isCheckoutOpen)}>Checkout</Button>
          )}
          {isCheckoutOpen && <Checkout toggleCheckout={() => setIsCheckoutOpen(!isCheckoutOpen)}/>}
        </>
      )}
    </div>
  )
})

export default Cart
