'use client'
import React from 'react'
import { observer } from 'mobx-react-lite'

import { type LucideProps } from 'lucide-react'

import { cn } from '@hanzo/ui/util'
import type { LineItem } from '../../types'

  // Generalize this.
const BagIcon: React.FC<LucideProps> = (props: LucideProps) => (
  <svg fill="currentColor" viewBox='0 0 20 23' {...props}>
    <path fillRule="evenodd" d="M5 5a5 5 0 0 1 10 0v1h-2V5a3 3 0 1 0-6 0v1H5V5Zm0 1v4h2V6h6v4h2V6h3.5a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1H5Z" clipRule="evenodd"/>
  </svg>
)

const QuantityIndicator: React.FC<{
  item: LineItem
  clx?: string
  iconClx?: string
  digitClx?: string
}> = observer(({
  item,
  clx='',
  iconClx='',
  digitClx=''
}) => {

  if (!item.isInCart) {
    return <div /> 
  }

  return (
    <div className={cn('relative aspect-square flex items-center justify-center', clx)} >
      <div className={cn(
        'z-above-content flex flex-col justify-center items-center',
        'absolute left-0 right-0 top-0 bottom-0',
        digitClx
      )}>
        <div className='h-[1px] w-full' />
        <div style={{color: 'black' /* tailwind bug */}}>{item.quantity}</div>
      </div>
      <BagIcon className={cn('relative -top-[12%] h-full ', iconClx, )} aria-hidden="true" />
    </div>            
  )
}) // -top-[3px] 

export default QuantityIndicator
