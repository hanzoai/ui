'use client'
import React, { useState, type ReactNode } from 'react'

import { X as LucideX} from 'lucide-react'

import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  Button,
} from '@hanzo/ui/primitives'

import { cn } from '@hanzo/ui/util'

import BuyCard from './buy-card'
import RadioItemSelector from '../select/radio-selector'
import ImageItemSelector from '../select/image-selector'

const BuyDrawer: React.FC<{
  skuPath: string
  trigger: ReactNode
  triggerClx?: string  
  drawerClx?: string
  cardClx?: string
  mobile?: boolean
}> = ({
  skuPath,
  trigger,
  triggerClx='',
  drawerClx='',
  cardClx='',
  mobile=false
}) => {

  const [open, setOpen] = useState<boolean>(false)

  const onQuantityChanged = (sku: string, oldV: number, newV: number) => {
    //if (oldV === 0 && newV === 1) {
    //  setTimeout(() => {setOpen(false)}, 150)
    //}
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} >
      <DrawerTrigger asChild className={triggerClx}>
        {trigger}
      </DrawerTrigger>
      <DrawerContent 
        className={cn('rounded-t-xl z-[52] mt-6 pb-12 h-auto min-h-[35vh] pt-6 md:max-w-[550px] md:mx-auto', drawerClx)}
        overlayClx='z-[51]'
      >
        <BuyCard 
          skuPath={skuPath} 
          mobile={mobile} 
          onQuantityChanged={onQuantityChanged} 
          className={cn('w-full', cardClx)}
          selector={ImageItemSelector}
          selClx=''
          selItemClx=''
          selSoleItemClx='mb-3'
          addWidgetClx=''
          facetsAs='label'
        />
        <Button
          variant='ghost'
          size='icon'
          onClick={() => {setOpen(false)}}
          className={'absolute top-4 right-4 w-8 h-8 group rounded-full p-1 hidden md:flex items-center'}
        >
          <LucideX className='w-6 h-6 text-muted group-hover:text-foreground'/>
        </Button>    

      </DrawerContent>
    </Drawer>
  )
}

export default BuyDrawer
