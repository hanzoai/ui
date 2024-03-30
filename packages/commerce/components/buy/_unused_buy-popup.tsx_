'use client'
import React, {useState, type PropsWithChildren} from 'react'

import { X } from 'lucide-react'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose
} from "@hanzo/ui/primitives"

import { cn } from '@hanzo/ui/util'

import BuyCard from './buy-item-card'

const BuyPopup: React.FC<PropsWithChildren & {
  skuPath: string
  triggerClx?: string  
  popupClx?: string
  cardClx?: string
}> = ({
  skuPath,
  children,
  triggerClx='',
  popupClx='',
  cardClx='',
}) => {
  
  const [open, setOpen] = useState<boolean>(false)

  const onQuantityChanged = (sku: string, oldV: number, newV: number) => {
    if (oldV === 0 && newV === 1) {
      setTimeout(() => {setOpen(false)}, 150)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className={triggerClx}>
        {children}
      </PopoverTrigger>
      <PopoverContent className={cn('relative flex flex-col p-0 px-4 pb-4 pt-2', popupClx)}>
        <PopoverClose className='absolute z-20 right-2 top-2 self-end hover:bg-level-3 text-muted hover:text-accent p-1 rounded-full'><X className='w-5 h-5'/></PopoverClose>
        <BuyCard skuPath={skuPath} onQuantityChanged={onQuantityChanged} className={cn("w-full relative ", cardClx)}/>
      </PopoverContent>
    </Popover>
  )
}

export default BuyPopup
