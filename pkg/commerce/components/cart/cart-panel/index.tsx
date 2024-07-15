'use client'
import React, { useLayoutEffect, type PropsWithChildren } from 'react'
import { reaction } from 'mobx'
import { observer } from 'mobx-react-lite'

import { Button, ScrollArea } from '@hanzo/ui/primitives'
import { cn } from '@hanzo/ui/util'

import type { LineItem } from '../../../types'
import { useCommerce } from '../../../service/context'
import { sendFBEvent, sendGAEvent } from '../../../util/analytics'

import CartLineItem from './cart-line-item'
import TotalArea from './total-area'

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
  showPromoCode?: boolean
  showShipping?: boolean
  selectItems?: boolean
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
  showPromoCode=false,
  showShipping=false,
  selectItems=false,
  handleCheckout,
}) => {

  const cmmc = useCommerce()

  useLayoutEffect(() => {
    if (!cmmc) {
      return
    }
    if (!cmmc.cartEmpty && !cmmc.currentItem) {
      cmmc.setCurrentItem(cmmc.cartItems[0].sku)  
    }
      // return mobx disposer
    return reaction(() => (
      cmmc.cartItems.length  
    ), 
    (itemCount) => {
      if (itemCount > 0) {
        cmmc.setCurrentItem(cmmc.cartItems[0].sku)  
      }
    })
  }, [])
  
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
        item_category: item.familyId,
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

  const itemClicked = (item: LineItem) => { 
    cmmc.setCurrentItem(item.sku) 
  }

  const MainStuff: React.FC = observer(() => (<>
    {cmmc.cartEmpty ? (
      <p className={cn('text-center my-3', noItemsClx)}>No items</p>
    ) : (<>
    {cmmc.cartItems.map((item) => (
      <CartLineItem
        key={`mobile-${item.sku}`}
        imgSizePx={imgSizePx}
        item={item}
        className={cn('mb-2', itemClx)}
        showPromoCode={showPromoCode}
        itemClicked={selectItems ? itemClicked : undefined}
        selected={selectItems ? cmmc.currentItem?.sku === item.sku : false}
      />
    ))}
    </>)}
    <TotalArea clx={totalClx} showPromoCode={showPromoCode} showShipping={showShipping}/>
  </>))

  const scrolling = (cmmc.cartItems.length > scrollAfter)

  return (
    <div className={cn(
      'border p-4 rounded-lg flex flex-col', 
      className, 
      scrolling ? scrollHeightClx : 'h-auto'
    )}>
      {children}
      {scrolling ? (
        <ScrollArea className={cn('mt-2 w-full shrink py-0', listClx)}>
          <MainStuff />
        </ScrollArea>
      ) : (
        <div className={cn('mt-2 w-full', listClx)}>
          <MainStuff />
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
