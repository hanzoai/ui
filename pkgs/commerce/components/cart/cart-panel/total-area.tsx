'use client'
import React, { Suspense } from 'react'
import { observer } from 'mobx-react-lite'

import { cn } from '@hanzo/ui/util'

import { formatCurrencyValue } from '../../../util'
import PromoCode from './promo-code'
import { useCommerce } from '../../../service/context'

const TotalArea: React.FC<{
  showPromoCode?: boolean
  showShipping?: boolean
  clx?: string
}> = observer(({
  showPromoCode=false,
  showShipping=false,
  clx
}) => {

  const cmmc = useCommerce()

  return (
    <div className={clx}> 
    {showPromoCode && (
      <Suspense>
        <PromoCode/>
      </Suspense>
    )}
    {(showShipping || showPromoCode) && (
      <div className={'flex flex-col gap-0.5 pb-1.5 text-sm ' + (!showPromoCode ? 'border-t pt-1.5' : '')} >
        <p className='flex justify-between'>
          <span className='text-muted-1'>Subtotal</span>
          <span className='font-semibold'>{cmmc.cartTotal === 0 ? '0' : formatCurrencyValue(cmmc.cartTotal)}</span>
        </p>
        {cmmc.promoAppliedCartTotal !== cmmc.cartTotal && (
          <p className='flex justify-between'>
            <span className='text-muted-1'>Promo Discount</span>
            <span className='font-semibold'>-{formatCurrencyValue(cmmc.cartTotal - cmmc.promoAppliedCartTotal)}</span>
          </p>
        )}
        {showShipping && (
          <p className='flex justify-between'>
            <span className='text-muted-1'>Shipping</span>
            <span className='font-semibold'>Free Global Shipping</span>
          </p>
        )}
      </div>
    )}
      <p className={cn('border-t py-2 flex justify-between')}>
        TOTAL
        <span className='font-semibold'>
          {formatCurrencyValue(showPromoCode ? cmmc.promoAppliedCartTotal : cmmc.cartTotal)}
        </span>
      </p>
    </div>
  )
})

export default TotalArea
