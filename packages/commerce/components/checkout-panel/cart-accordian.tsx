'use client'
import React  from 'react'
import { observer } from 'mobx-react-lite'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@hanzo/ui/primitives'

import { formatPrice, useCommerce } from '../..'

import CartPanel from '../cart-panel'
import BagIcon from './icons/bag-icon'
import { ChevronRight } from 'lucide-react'

const CartAccordian: React.FC<{className?: string}> = observer(({
  className=''
}) => { 

  const cmmc = useCommerce()
  return (
    <Accordion type="single" collapsible className={className}>
      <AccordionItem value="cart" className='w-full border-b-0'>
        <AccordionTrigger className='!no-underline group flex justify-between'>
          <div className='flex gap-1 items-center'>
            <BagIcon className='w-4 h-4 relative -top-0.5 sm:w-6 shrink-0 sm:h-6'/>
            <h5 className='text-sm sm:text-xl grow'>
              <span className='group-data-[state=open]:hidden' >Order Total:</span>
              <span className='group-data-[state=closed]:hidden' >Your Order</span>
            </h5>
          </div>
          <div className='flex gap-1 items-center'>
            <h5 className='text-sm sm:text-xl grow truncate'>{formatPrice(cmmc.cartTotal)}</h5>
            <ChevronRight className="h-5 w-5 -mr-2 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
          </div>
        </AccordionTrigger>
        <AccordionContent className='data-[state=open]:mb-4'>
          <CartPanel className='w-full'/>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
})

export default CartAccordian
