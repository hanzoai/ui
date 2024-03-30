'use client'
import React  from 'react'
import { observer } from 'mobx-react-lite'

import { ChevronRight } from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@hanzo/ui/primitives'

import { formatCurrencyValue } from '../../util'
import { useCommerce } from '../../service/context'

import CartPanel from './cart-panel'

const CartAccordian: React.FC<{
  icon?: React.ReactNode
  className?: string
}> = observer(({
  icon,
  className=''
}) => { 
  const cmmc = useCommerce()
  return (
    <Accordion type="single" collapsible className={className}>
      <AccordionItem value="cart" className='w-full border-b-0'>
        <AccordionTrigger className='!no-underline group flex justify-between'>
          <div className='flex gap-0 items-center'>
            {icon}
            <h5 className='text-sm sm:text-xl grow'>
              <span className='group-data-[state=open]:hidden' >Order Total:</span>
              <span className='group-data-[state=closed]:hidden' >Your Order</span>
            </h5>
          </div>
          <div className='flex gap-1 items-center'>
            <h5 className='text-sm sm:text-xl grow truncate'>{formatCurrencyValue(cmmc.promoAppliedCartTotal)}</h5>
            <ChevronRight className="h-5 w-5 -mr-2 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
          </div>
        </AccordionTrigger>
        <AccordionContent className='data-[state=open]:mb-4'>
          <CartPanel 
            className='w-full '
            scrollAfter={4}
            scrollHeightClx='h-[350px]'
            itemClx='mt-2'
            totalClx='sticky px-1 pr-2 border-t -bottom-[1px] bg-background'
            showShipping
            showPromoCode
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
})

export default CartAccordian
