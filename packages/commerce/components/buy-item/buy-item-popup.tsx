'use client'
import React, {type PropsWithChildren} from 'react'

import { X } from 'lucide-react'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose
} from "@hanzo/ui/primitives"

import { cn } from '@hanzo/ui/util'

import BuyItemCard from './buy-item-card'

const BuyItemPopup: React.FC<PropsWithChildren & {
  skuPath: string
  popupClx?: string
  cardClx?: string
}> = ({
  skuPath,
  children,
  popupClx='',
  cardClx='',
}) => (
  <Popover>
    <PopoverTrigger asChild>
      {children}
    </PopoverTrigger>
    <PopoverContent className={cn('relative flex flex-col p-0 px-4 pb-4 pt-2', popupClx)}>
      <PopoverClose className='absolute z-20 right-2 top-2 self-end hover:bg-level-3 text-muted hover:text-accent p-1 rounded-full'><X className='w-5 h-5'/></PopoverClose>
      <BuyItemCard skuPath={skuPath} className={cn("w-full relative ", cardClx)}/>
    </PopoverContent>
  </Popover>
)

export default BuyItemPopup
