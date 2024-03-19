'use client'

import { useState }  from 'react'
import { observer } from 'mobx-react-lite'

import { Dialog, DialogPortal, Separator, Toaster } from '@hanzo/ui/primitives'
import { cn } from '@hanzo/ui/util'
import { useAuth } from '@hanzo/auth/service'
import { LoginComponent, AuthWidget } from '@hanzo/auth/components'

import ShippingInfo from './shipping-info'
import ThankYou from './thank-you'
import CartPanel from '../cart-panel'
import Payment from './payment'
import CloseButton from './close-button'
import StepIndicator from './step-indicator'

const CheckoutPanel: React.FC<{
  open: boolean
  setOpen: (open: boolean) => void
}> = observer(({
  open,
  setOpen
}) => {

  const auth = useAuth()
  
  const [step, setStep] = useState<number>(1)
  const [orderId, setOrderId] = useState<string>()

  const steps = {
    1: {
      label: 'Payment',
      element: (
        auth.loggedIn ? (
          <Payment
            orderId={orderId} 
            setOrderId={setOrderId}
            setStep={setStep}
          />
        ) : (
          <LoginComponent hideHeader className='max-w-[20rem] mx-auto' inputClassName='border-muted-4'>
            <h6 className='font-nav'>Please login to proceed</h6>
          </LoginComponent >
        )
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
    setOpen(false)
  }

  return (
    <Dialog open={open}>
      <DialogPortal>
        <div id='PORTAL_OUTER'
          className={cn(
            'fixed top-0 pt-[44px] md:pt-[80px] shadow-lg ',
            'animate-in data-[state=open]:fade-in-90 data-[state=open]:slide-in-from-bottom-10',
            'sm:zoom-in-90 data-[state=open]:sm:slide-in-from-bottom-0',
            '!max-w-none w-full h-full min-h-screen bg-transparent backdrop-blur-sm z-50'
          )}
        >
          <div id='GRID' className='grid  grid-cols-1 md:grid-cols-2 justify-center h-full overflow-y-auto md:overflow-y-hidden'>
            <div className='bg-background flex flex-row items-start justify-end'>
              <div className='h-full w-full max-w-[750px] relative flex flex-col items-center justify-start px-6 py-8 sm:py-20 '>
                <CloseButton onClose={onClose} className='absolute top-2 left-4 w-auto h-auto rounded-full bg-level-1 hover:bg-level-2 hover:border-muted p-2' />
                <AuthWidget hideLogin className='flex md:hidden absolute top-4 right-4 '/>
                <CartPanel noCheckout className='md:border md:border-muted-2 mt-10 w-full max-w-[550px]'/>
              </div>
            </div>
            <div className='bg-level-1 flex flex-row items-start justify-start'>
              <div className='h-full w-full max-w-[750px] relative flex flex-col gap-8 sm:gap-14 md:overflow-y-auto px-6 pb-6'>
                <Toaster/>  
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
