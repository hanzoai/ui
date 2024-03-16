'use client'

import { useState }  from 'react'
import { ChevronLeft } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button, Main, Separator, Toaster } from '@hanzo/ui/primitives'
import { cn } from '@hanzo/ui/util'
import { useAuth } from '@hanzo/auth/service'
import { LoginComponent, AuthWidget } from '@hanzo/auth/components'

import ShippingInfo from './shipping-info'
import ThankYou from './thank-you'
import { Cart } from '..'
import Payment from './payment'

const Checkout: React.FC<{toggleCheckout: () => void}> = observer(({toggleCheckout}) => {
  const auth = useAuth()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [orderId, setOrderId] = useState<string>()

  const step1 = auth.loggedIn ? (
    <Payment
      orderId={orderId} 
      setOrderId={setOrderId}
      setCurrentStep={setCurrentStep}
    />
  ) : (
    <LoginComponent hideHeader className='max-w-[20rem] mx-auto'/>
  )

  const step2 = (
    <ShippingInfo orderId={orderId} setCurrentStep={setCurrentStep}/>
  )

  const step3 = <ThankYou/>

  const steps = [step1, step2, step3]

  return (
    <div className="fixed top-0 left-0 !max-w-none w-full h-full min-h-screen bg-background z-50">  
      <Toaster/>  
      <Main className='flex flex-col gap-1 h-full'>
        <div className='flex justify-between items-center'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => {
              setCurrentStep(0)
              toggleCheckout()
            }}
          >
            <ChevronLeft/>
          </Button>
          <AuthWidget/>
        </div>    

        <div className='grid grid-cols-5 justify-center gap-8 h-full'>
          <div className='col-span-2 hidden md:flex'>
            <Cart hideCheckout className='fixed justify-center border-none mt-10 w-1/3 max-w-[40rem]'/>
          </div>

          <div className='flex flex-col gap-8 sm:gap-14 col-span-5 md:col-span-3 max-w-[30rem] w-full mx-auto overflow-y-auto h-[calc(100%-40px)] sm:h-[calc(100%-48px)] py-4 px-1'>
            <div className='flex gap-2 mx-auto items-center text-xxs sm:text-base'>
              <div className={cn('w-6 h-6 rounded-full border border-foreground flex flex-col justify-center items-center', currentStep === 1 ? 'bg-foreground text-muted-4' : '')}>
                <div className='relative text-foreground top-4 h-0 whitespace-nowrap'>Payment</div>
              </div>
              <Separator className='w-[4rem] sm:w-[6rem]'/>
              <div className={cn('w-6 h-6 rounded-full border border-foreground flex flex-col justify-center items-center', currentStep === 2 ? 'bg-foreground text-muted-4' : '')}>
                <div className='relative text-foreground top-4 h-0 whitespace-nowrap'>Delivery</div>
              </div>
              <Separator className='w-[4rem] sm:w-[6rem]'/>
              <div className={cn('w-6 h-6 rounded-full border border-foreground flex flex-col justify-center items-center', currentStep === 3 ? 'bg-foreground text-muted-4' : '')}>
                <div className='relative text-foreground top-4 h-0 whitespace-nowrap'>Done!</div>
              </div>
            </div>
            {steps[currentStep - 1]}
          </div>
        </div>
      </Main>
    </div>
  )
})

export default Checkout
