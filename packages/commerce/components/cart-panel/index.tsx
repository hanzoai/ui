'use client'
import React, { type PropsWithChildren } from 'react'
import { observer } from 'mobx-react-lite'

import { Button } from '@hanzo/ui/primitives'
import { cn } from '@hanzo/ui/util'

import { useCommerce } from '../../service/context'
import { formatPrice } from '../../util'

import CartLineItem from './cart-line-item'
import { sendFBEvent, sendGAEvent } from '../../util/analytics'

const CartPanel: React.FC<PropsWithChildren & {
  className?: string
  isMobile?: boolean,
  noCheckout?: boolean
  onCheckoutOpen?: () => void
}> = observer(({
    /** Children is the heading area. */
  children,
  className='',
  isMobile=false,
  noCheckout=false,
  onCheckoutOpen,
}) => {
  /* TODO: onCheckoutOpen is a hackish way fix a bug with multiple dialog opened at the same time.
  *  Needs refactor with context or so.
  **/
  const cmmc = useCommerce()
  if (!cmmc) {
    return <div />
  }

  const showCheckout = () => {
    sendGAEvent('begin_checkout', {
      currency: 'USD',
      value: cmmc.cartTotal,
      items: cmmc.cartItems.map((item) => ({
        item_id: item.sku,
        item_name: item.title,
        item_category: item.categoryId,
        price: item.price,
        quantity: item.quantity
      })),
    })
    sendFBEvent('InitiateCheckout', {
      content_ids: cmmc.cartItems.map((item) => item.sku),
      contents: cmmc.cartItems.map(item => ({
        id: item.sku,
        quantity: item.quantity
      })),
      num_items: cmmc.cartItems.length,
      value: cmmc.cartTotal,
      currency: 'USD',
    })
    onCheckoutOpen && onCheckoutOpen()
  }

  return (
    <div className={cn('border p-4 rounded-lg', className)}>
      {children}
      <div className='mt-2 w-full'>
        {cmmc.cartEmpty ? (
          <p className='text-center mt-4'>No items in cart</p>
        ) : (<>
          {cmmc.cartItems.map((item, i) => (
            <CartLineItem isMobile={isMobile} item={item} key={item.sku} className='mb-2 md:mb-3'/>
          ))}
          <p className='mt-6 text-right border-t pt-1'>TOTAL: <span className='font-semibold'>{cmmc.cartTotal === 0 ? '0' : formatPrice(cmmc.cartTotal)}</span></p>
        </>)}
      </div>
      {!noCheckout && (<>
        {!cmmc.cartEmpty && (
          <Button 
            variant='primary' 
            rounded='lg' 
            className='mt-12 mx-auto w-full' 
            onClick={showCheckout}
          >
            Checkout
          </Button>
        )}
      </>)}
    </div>
  )
})

export default CartPanel
