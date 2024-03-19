'use client'
import React, { useState, type ReactNode } from 'react'

//import { X as LucideX} from 'lucide-react'
//import { Sheet, SheetContent, SheetTrigger } from '@hanzo/ui/primitives'

import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
} from '@hanzo/ui/primitives'

import { cn } from '@hanzo/ui/util'

import BuyItemCard from './buy-item-card'

const BuyItemMobileDrawer: React.FC<{
  skuPath: string
  trigger: ReactNode
  triggerClx?: string  
  drawerClx?: string
  cardClx?: string
}> = ({
  skuPath,
  trigger,
  triggerClx='',
  drawerClx='',
  cardClx=''
}) => {

  const [open, setOpen] = useState<boolean>(false)

  const onQuantityChanged = (sku: string, oldV: number, newV: number) => {
    if (oldV === 0 && newV === 1) {
      setTimeout(() => {setOpen(false)}, 150)
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} >
      <DrawerTrigger asChild className={triggerClx}>
        {trigger}
      </DrawerTrigger>
      <DrawerContent 
        className={cn('rounded-tl-xl rounded-tr-xl p-0 overflow-hidden', drawerClx)}
       // side="bottom" 
      >
        <BuyItemCard skuPath={skuPath} mobile onQuantityChanged={onQuantityChanged} className={cn("w-full relative ", cardClx)}/>
      </DrawerContent>
    </Drawer>
  )
}

export default BuyItemMobileDrawer
