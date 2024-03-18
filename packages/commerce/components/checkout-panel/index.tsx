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
import CartPanel from '../cart-panel'
import Payment from './payment'

const CheckoutPanel: React.FC<{
  close: () => void
}> = observer(({
  close
}) => {

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
    <LoginComponent hideHeader className='max-w-[20rem] mx-auto' inputClassName='border-muted-4'/>
  )

  const step2 = (
    <ShippingInfo orderId={orderId} setCurrentStep={setCurrentStep}/>
  )

  const step3 = <ThankYou/>

  const steps = [step1, step2, step3]

  return (
    <div className="fixed top-0 left-0 !max-w-none w-full h-full min-h-screen bg-background z-50">  
      <Toaster/>  
      <div className='absolute flex w-full justify-between pt-2 md:pt-5 px-2 md:px-5'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => {
            setCurrentStep(0)
            close()
          }}
          className='w-auto h-auto rounded-full bg-level-1 p-2 md:p-4'
        >
          <ChevronLeft className='w-5 h-5'/>
        </Button>    
        <AuthWidget/>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 justify-center h-full overflow-y-auto md:overflow-y-hidden'>
        <div className='flex items-center justify-center py-2'>
          <CartPanel noCheckout className='border-none mt-10 w-full lg:w-1/2'/>
        </div>

        <div className='bg-level-1'>
          <Main className='flex flex-col h-full md:h-[calc(100vh-48px)] gap-8 sm:gap-14 max-w-[30rem] w-full mx-auto md:overflow-y-auto px-2 pb-6 md:mt-12'>
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
          </Main>
        </div>
      </div>
    </div>
  )
})

export default CheckoutPanel
