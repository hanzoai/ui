'use client'

import { useState }  from 'react'
import { observer } from 'mobx-react-lite'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Dialog,
  DialogPortal,
} from '@hanzo/ui/primitives'
import { cn } from '@hanzo/ui/util'
import { AuthWidget } from '@hanzo/auth/components'

import ShippingInfo from './shipping-info'
import ThankYou from './thank-you'
import CartPanel from '../cart-panel'
import Payment from './payment'
import CloseButton from './close-button'
import StepIndicator from './step-indicator'
import BagIcon from './icons/bag-icon'
import { formatPrice, useCommerce } from '../..'

const CheckoutPanel: React.FC<{
  open: boolean
  onCheckoutClose: () => void
}> = observer(({
  open,
  onCheckoutClose
}) => {

  const cmmc = useCommerce()
    
    // For sites that don't initialize cmmc
  if (!cmmc) {
    return <></>
  }
  
  const [step, setStep] = useState<number>(1)
  const [orderId, setOrderId] = useState<string>()

  const steps = {
    1: {
      label: 'Payment',
      element: (
        <Payment
          orderId={orderId} 
          setOrderId={setOrderId}
          setStep={setStep}
        />
    )}
    , 
    2: {
      label: 'Delivery',
      element: (
        <ShippingInfo orderId={orderId} setStep={setStep}/>   
    )}, 
    3: {
      label: 'Done!',
      element: (
      <ThankYou/>  
    )}
  } as Record<number, {label: string, element: JSX.Element}>

  const onClose = () => {
    setStep(1)
    onCheckoutClose()
  }

  return (
    <Dialog open={open}>
      <DialogPortal>
        <div id='PORTAL_OUTER'
          className={cn(
            'fixed top-0 shadow-lg ',
            'animate-in data-[state=open]:fade-in-90 data-[state=open]:slide-in-from-bottom-10',
            'sm:zoom-in-90 data-[state=open]:sm:slide-in-from-bottom-0',
            '!max-w-none w-full h-full min-h-screen bg-transparent backdrop-blur-sm z-50'
          )}
        >
          <div id='GRID' className='grid  grid-cols-1 md:grid-cols-2 justify-center h-full overflow-y-auto md:overflow-y-hidden'>
            <div className='bg-background flex flex-row items-start justify-end'>
              <div className='h-full w-full max-w-[750px] relative flex flex-col items-center justify-start px-6 pt-10 pb-0 md:pb-9'>
                <CloseButton onClose={onClose} className='absolute top-3 left-3 w-auto h-auto rounded-full bg-level-1 hover:bg-level-2 hover:border-muted p-2' />
                <AuthWidget hideLogin className='flex md:hidden absolute top-3 right-3'/>
                <CartPanel noCheckout className='border border-muted-2 mt-10 w-full max-w-[550px] hidden md:flex'/>

                <Accordion type="single" collapsible className='flex items-center justify-center py-2 w-full md:hidden'>
                  <AccordionItem value="cart" className='w-full border-b-0'>
                    <AccordionTrigger className='!no-underline'>
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
              </div>
            </div>
            <div className='bg-level-1 flex flex-row items-start justify-start md:overflow-y-auto'>
              <div className='h-full w-full max-w-[750px] relative flex flex-col gap-8 sm:gap-14 px-8 pb-6 pt-6 md:pt-14'>
                <AuthWidget hideLogin className='hidden md:flex absolute top-4 right-4 '/>
                <StepIndicator steps={steps} currentStep={step} className='flex gap-2 mx-auto items-center text-xxs sm:text-base' />
                {steps[step].element}
              </div>
            </div>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  )
})

export default CheckoutPanel
