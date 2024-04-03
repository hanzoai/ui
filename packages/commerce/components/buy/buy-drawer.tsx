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

import { getUISpecFromPath } from '../../util'

import BuyCard from './buy-card'
import RadioItemSelector from '../select/radio-selector'
import ImageItemSelector from '../select/image-selector'
import CarouselItemSelector from '../select/carousel-selector'

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

  const spec = getUISpecFromPath(skuPath) ?? {
    selector: 'radio',
    allVariants: false
  }

  const selector = spec.selector === 'radio' ? RadioItemSelector :
    (spec.selector === 'image' ? ImageItemSelector : CarouselItemSelector)

  return (
    <Drawer open={open} onOpenChange={setOpen} >
      <DrawerTrigger asChild className={triggerClx}>
        {trigger}
      </DrawerTrigger>
      <DrawerContent 
        className={cn('rounded-t-xl mt-6 pb-12 h-auto min-h-[35vh] pt-6 md:max-w-[550px] md:mx-auto', drawerClx)}
      >
        <BuyCard 
          skuPath={skuPath} 
          scrollAfter={spec.selector === 'carousel' ? 999 : undefined}
          mobile={mobile} 
          onQuantityChanged={onQuantityChanged} 
          clx={cn('w-full', cardClx)}
          selector={selector}
          selectorProps={{soleItemClx:'mb-3'}}
          showItemMedia={spec.selector !== 'carousel'}
          categoryTabAs='label'
          allVariants={spec.allVariants}
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
