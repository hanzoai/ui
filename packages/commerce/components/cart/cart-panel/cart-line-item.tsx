'use client'

import React from 'react'
import { observer } from 'mobx-react-lite'

import { cn } from '@hanzo/ui/util'
import { Image } from '@hanzo/ui/primitives'

import type { LineItem } from '../../../types'
import { formatCurrencyValue } from '../../../util'
import AddToCartWidget from '../../buy/add-to-cart-widget'
import { useCommerce } from '../../../service/context'

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
  itemClicked?: (item: LineItem) => void
  selected?: boolean
}> = observer(({
  item,
  className='',
  imgSizePx=DEF_IMG_SIZE,
  showPromoCode=false,
  itemClicked,
  selected=false
}) => {

  const cmmc = useCommerce()
  const promoPrice = showPromoCode ? cmmc.itemPromoPrice(item) : undefined

  return (
    <div className={cn('flex flex-col justify-start items-start text-sm font-sans', className)}>
      <div 
        className={
          'flex flex-row justify-between items-center gap-1 ' + 
          (itemClicked && !selected ? 'cursor-pointer ' : 'cursor-default ') 
        } 
        onClick={() => {itemClicked && itemClicked(item)}}
      >
        {/* 1px gap between image and border for better emphasis w small images */}
        <div className={selected ? 'border-foreground p-[1px] border rounded-sm' : 'p-[2px]'}>
        {item.img ? (
          <Image def={item.img} constrainTo={{w: imgSizePx, h: imgSizePx}} />
        ) : ( // placeholder so things align
          <div style={{height: imgSizePx, width: imgSizePx}} className='bg-level-3'/>
        )}
        </div>
        <div className='grow leading-tight ml-1'>{renderTitle(item.title)}</div>
      </div>
      <div className='flex flex-row items-center justify-between w-full'>
        <div className='flex flex-row items-center'>
          <AddToCartWidget className='' item={item} size='xs' buttonClx='h-8 md:h-6' variant='minimal'/>
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
