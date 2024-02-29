'use client'
import React, { type PropsWithChildren, useState } from 'react'
import { observer } from 'mobx-react-lite'

import { Button } from '@hanzo/ui/primitives'
import { cn } from '@hanzo/ui/util'

import { persistCart, useCommerce } from '../service'
import { formatPrice } from '../util'

import CartLineItem from './cart-line-item'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../hanzo-auth/service'


const Cart: React.FC<PropsWithChildren & {
  className?: string
  isMobile?: boolean,
  hideCheckout?: boolean
}> = observer(({
  children,
  className='',
  isMobile=false,
  hideCheckout=false
}) => {
  const [loadingCheckout, setLoadingCheckout] = useState(false)
  const c = useCommerce()
  const router = useRouter()
  const auth = useAuth()

  const checkout = async () => {
    setLoadingCheckout(true)
    if (auth.user) {
      await persistCart(c.cartItems, auth.user.email)
    }
    router.push('/checkout')
  }
  
  return (
    <div className={cn('border p-6 rounded-lg', className)}>
      {children}
      <div className='mt-2'>
        {!!children && <div className='h-[1px] w-pr-80 mx-auto bg-muted-3'/>}
      {c.cartItems.length === 0 ? (
        <p className='text-center mt-4'>No items in cart</p>
      ) : (<>
        {c.cartItems.map((item, i) => (<CartLineItem isMobile={isMobile} item={item} key={item.sku} className='mb-4 sm:mb-2'/>))}
        <p className='mt-6 text-right border-t pt-1'>TOTAL: {c.cartTotal === 0 ? '0' : formatPrice(c.cartTotal)}</p>
      </>)}
      </div>
      {c.cartItems.length > 0 && !hideCheckout && (
        <>
          {!auth.loggedIn ? (
            <Button size='lg' variant='secondary' rounded='lg' className='mt-12 mx-auto' onClick={() => router.push('/login?redirectUrl=checkout')}>Login</Button>
          ) : (
            <Button size='lg' variant='secondary' rounded='lg' className='mt-12 mx-auto' onClick={checkout} disabled={loadingCheckout}>Checkout</Button>
          )}
        </>
      )}
    </div>
  )
})

export default Cart
