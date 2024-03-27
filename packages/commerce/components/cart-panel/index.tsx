'use client'
import React, { type PropsWithChildren } from 'react'
import { observer } from 'mobx-react-lite'

import { Button, ScrollArea } from '@hanzo/ui/primitives'
import { cn } from '@hanzo/ui/util'

import { useCommerce } from '../../service/context'
import { formatPrice } from '../../util'
import { sendFBEvent, sendGAEvent } from '../../util/analytics'

import CartLineItem from './cart-line-item'

const CartPanel: React.FC<PropsWithChildren & {
    /** fix size and scroll after 'scrollAfter items in teh cart. */
  scrollAfter?: number
  scrollHeightClx?: string
  imgSizePx?: number
  className?: string
  itemClx?: string
  listClx?: string
  noItemsClx?: string
  totalClx?: string
  buttonClx?: string
    /** if not provided, 'checkout' button will be rendered */
  handleCheckout?: () => void
}> = observer(({
    /** If provided, 'children' is rendered above the items. eg, a heading. */
  children,
  scrollAfter=5,
  scrollHeightClx='h-[70vh]',
  imgSizePx=40,
  className='',
  itemClx='',
  listClx='',
  noItemsClx='',
  totalClx='',
  buttonClx='',
  handleCheckout,
}) => {

  const cmmc = useCommerce()
  if (!cmmc) {
    return <div />
  }

  const _handleCheckout = () => {
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
    handleCheckout && handleCheckout()
  }

  const Main: React.FC = () => (<>
    {cmmc.cartEmpty ? (
      <p className={cn('text-center mt-4', noItemsClx)}>No items in cart</p>
    ) : (<>
    {cmmc.cartItems.map((item) => (
      <CartLineItem imgSizePx={imgSizePx} item={item} key={`mobile-${item.sku}`} className={cn('mb-2', itemClx)}/>
    ))}
    </>)}
    <p className={cn('mt-6 text-right border-t pt-1', totalClx)}>
      <span>TOTAL:&nbsp;</span>
      <span className='font-semibold'>{cmmc.cartTotal === 0 ? '0' : formatPrice(cmmc.cartTotal)}</span>
    </p>
  </>)

  const scrolling = (): boolean => (cmmc.cartItems.length > scrollAfter)

  return (
    <div className={cn('border p-4 rounded-lg flex flex-col', className, scrolling() ? scrollHeightClx : 'h-auto')}>
      {children}
      {scrolling() ? (
        <ScrollArea className={cn('mt-2 w-full shrink py-0', listClx)}>
          <Main />
        </ScrollArea>
      ) : (
        <div className={cn('mt-2 w-full', listClx)}>
          <Main />
        </div>
      )}
      {handleCheckout && !cmmc.cartEmpty && (
        <Button 
          onClick={_handleCheckout} 
          variant='primary' 
          rounded='lg' 
          className={cn('mt-12 mx-auto w-full sm:max-w-[220px]', buttonClx)} 
        >
          Checkout
        </Button>
      )}
    </div>
  )
})

export default CartPanel
