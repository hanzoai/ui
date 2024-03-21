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

const CartAccordian: React.FC<{className?: string}> = observer(({
  className=''
}) => { 

  const cmmc = useCommerce()
  return (
    <Accordion type="single" collapsible className={className}>
      <AccordionItem value="cart" className='w-full border-b-0'>
        <AccordionTrigger className='!no-underline py-1'>
          <div className='flex gap-4 items-center'>
            <BagIcon className='w-4 h-4 sm:w-6 sm:h-6'/>
            <h5 className='text-sm sm:text-xl truncate'>Order Summary {formatPrice(cmmc.cartTotal)}</h5>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <CartPanel noCheckout className='border-none w-full'/>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
})

export default CartAccordian
