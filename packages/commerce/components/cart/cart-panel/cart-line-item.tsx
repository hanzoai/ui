'use client'

import React from 'react'
import Image from 'next/image'
import { observer } from 'mobx-react-lite'

import { cn } from '@hanzo/ui/util'

import type { LineItem } from '../../../types'
import { formatCurrencyValue } from '../../../util'
import AddToCartWidget from '../../buy/add-to-cart-widget'
import { useCommerce } from '../../../service/context'
import type { Dimensions } from '@hanzo/ui/types'

const DEF_IMG_SIZE=40

const renderTitle = (t: string): React.ReactNode => {
  const toks = t.split(', ')
  if (toks.length === 2) {
    return <><p>{toks[0]},</p><p className=''>{toks[1]}</p></>
  }
  return <p>{t}</p>
}

const CartLineItem: React.FC<{
  item: LineItem
  className?: string
  imgSizePx?: number
  showPromoCode?: boolean
}> = observer(({
  item,
  className='',
  imgSizePx=DEF_IMG_SIZE,
  showPromoCode
}) => {

  const cmmc = useCommerce()
  const promoPrice = showPromoCode ? cmmc.itemPromoPrice(item) : undefined
  
  let dim: Dimensions 
  if (item.imgAR) {
    if (item.imgAR >= 1) {
      dim = {
        w: imgSizePx,
        h: imgSizePx / item.imgAR
      }
    }
    else {
      dim = {
        w: imgSizePx * item.imgAR,
        h: imgSizePx
      }
    }
  }
  else {
    dim = {
      w: imgSizePx,
      h: imgSizePx
    }
  }

  return (
    <div className={cn('flex flex-col justify-start items-start text-sm font-sans', className)}>
      <div className='flex flex-row justify-between items-center gap-2'>
      {!!item.img ? (
        <Image src={item.img} alt={item.title + ' image'} height={dim.h} width={dim.w} className=''/>
      ) : ( // placeholder so things align
        <div style={{height: imgSizePx, width: imgSizePx}}/>
      )}
        <div className='grow leading-tight'>{renderTitle(item.title)}</div>
      </div>
      <div className='flex flex-row items-center justify-between w-full'>
        <div className='flex flex-row items-center'>
          <AddToCartWidget className='' item={item} size='xs' buttonClx='h-8 md:h-6' ghost/>
          {item.quantity > 1 && (<span className='pl-2.5'>{'@' + formatCurrencyValue(item.price)}</span>)}
        </div>
        <div className='flex flex-row gap-1 items-center justify-end'>
          <span className={promoPrice ? 'line-through	text-muted-2' : ''}>{formatCurrencyValue(item.price * item.quantity)}</span>
          {promoPrice && <span>{formatCurrencyValue(promoPrice * item.quantity)}</span>}
        </div>
      </div>
    </div>
  )
})

export default CartLineItem
