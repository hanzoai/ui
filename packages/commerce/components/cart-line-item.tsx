import React from 'react'
import { observer } from 'mobx-react-lite'
import Image from 'next/image'

import { cn } from '@hanzo/ui/util'

import type { LineItem } from '../types'
import AddToCartWidget from './add-to-cart-widget'
import { formatPrice } from '../util'

const IMG_SIZE=40

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
  isMobile?: boolean
}> = observer(({ 
  item,
  className='',
  isMobile=false 
}) => {

  const imgSize = (isMobile) ? IMG_SIZE * 0.65 : IMG_SIZE

  return (
    <div className={cn('flex flex-col justify-start items-start text-sm font-sans', className)}>
      <div className='flex flex-row justify-between items-center gap-2'>
      {!!item.img ? (
        <Image src={item.img} alt={item.title + ' image'} height={imgSize} width={imgSize} className=''/>
      ) : (
        <div style={{height: imgSize, width: imgSize}}/ >
      )}
        <div className='grow leading-tight'>{renderTitle(item.title)}</div>
      </div>
      <div className='flex flex-row items-center justify-between w-full'>
        <div className='flex flex-row items-center'>
          <AddToCartWidget isMobile={isMobile} className='' item={item} size='xs' buttonClx='h-8 md:h-6' ghost/>
          {item.quantity > 1 && (<span className='pl-2.5'>{'@' + formatPrice(item.price)}</span>)}
        </div>
        <div className='flex flex-row items-center justify-end'>
          {formatPrice(item.price * item.quantity)}
        </div>
      </div>
    </div>
  )
})

export default CartLineItem
