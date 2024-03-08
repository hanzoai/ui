'use client'

import { useEffect, useState }  from 'react'
import { ChevronLeft } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useForm } from 'react-hook-form'

import { ApplyTypography, Button, Main, Separator } from '@hanzo/ui/primitives'
import { cn } from '@hanzo/ui/util'
import { useAuth } from '@hanzo/auth/service'
import { LoginComponent } from '@hanzo/auth/components'

import ShippingInfo from './shipping-info'
import ThankYou from './thank-you'
import PayWithCrypto from './pay-with-crypto'
import PayByBankTransfer from './pay-by-bank-transfer'
import ContactInfo from './contact-info'
import { Cart } from '..'
import { useCommerce } from '../../service/context'

const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email(),
})

const Checkout: React.FC<{toggleCheckout: () => void}> = observer(({toggleCheckout}) => {
  const auth = useAuth()
  const cmmc = useCommerce()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<'crypto' | 'bank' | undefined>()
  const [orderId, setOrderId] = useState<string>()

  const contactForm = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),  
    defaultValues: {
      name: auth.user?.displayName ?? '',
      email: auth.user?.email ?? '',
    },
  })

  useEffect(() => {
    if (auth.loggedIn) {
      contactForm.setValue('name', auth.user?.displayName ?? '')
      contactForm.setValue('email', auth.user?.email ?? '')
    }
  }, [auth.loggedIn])

  const selectPaymentMethod = async (method: 'crypto' | 'bank') => {
    contactForm.handleSubmit(async () => {
      if (auth.user) {
        if (!!orderId) {
          await cmmc.updateOrder(orderId, auth.user.email, method)
        } else {
          const id = await cmmc.createOrder(auth.user.email, method)
          setOrderId(id)
        }
      }
      setPaymentMethod(method)
      setCurrentStep(2)
    })()    
  }


  const step1 = auth.loggedIn ? (
    <ContactInfo form={contactForm} selectPaymentMethod={selectPaymentMethod}/>
  ) : (
    <LoginComponent hideHeader className='max-w-[20rem] mx-auto'/>
  )

  const step2 = paymentMethod === 'crypto' ? (
    <PayWithCrypto setCurrentStep={setCurrentStep}/>
  ) : (
    <PayByBankTransfer setCurrentStep={setCurrentStep}/>
  )

  const step3 = (
    <ShippingInfo orderId={orderId} paymentMethod={paymentMethod} setCurrentStep={setCurrentStep}/>
  )

  const step4 = <ThankYou/>

  const steps = [step1, step2, step3, step4]

  return (
    <div className="fixed top-0 left-0 !max-w-none w-full h-full min-h-screen bg-background z-[51]">        
      <Main className='grid grid-cols-5 justify-center gap-8 overflow-y-auto h-full'>
        <Button
          variant='ghost'
          size='icon'
          className='absolute sm:ml-2 sm:mt-2'
          onClick={() => {
            setCurrentStep(0)
            toggleCheckout()
          }}
        >
          <ChevronLeft/>
        </Button>

        <div className='col-span-2 hidden md:flex'>
          <Cart hideCheckout className='fixed justify-center border-none mt-10 w-1/3 max-w-[40rem]'/>
        </div>

        <div className='flex flex-col gap-8 sm:gap-14 col-span-5 md:col-span-3 max-w-[40rem] mx-auto'>
          <ApplyTypography className='w-full'>
            <h3 className='!text-center w-1/2 mx-auto sm:w-full sm:mt-5'>FINALIZE PAYMENT</h3>
          </ApplyTypography>
          <div className='flex gap-2 mx-auto items-center text-xxs sm:text-base'>
            <div className={cn('w-6 h-6 rounded-full border border-foreground flex flex-col justify-center items-center', currentStep === 1 ? 'bg-foreground text-muted-4' : '')}>
              1
              <div className='relative text-foreground top-2 h-0 whitespace-nowrap'>Contact info</div>
            </div>
            <Separator className='w-[4rem] sm:w-[6rem]'/>
            <div className={cn('w-6 h-6 rounded-full border border-foreground flex flex-col justify-center items-center', currentStep === 2 ? 'bg-foreground text-muted-4' : '')}>
              2
              <div className='relative text-foreground top-2 h-0 whitespace-nowrap'>Payment</div>
            </div>
            <Separator className='w-[4rem] sm:w-[6rem]'/>
            <div className={cn('w-6 h-6 rounded-full border border-foreground flex flex-col justify-center items-center', currentStep === 3 ? 'bg-foreground text-muted-4' : '')}>
              3
              <div className='relative text-foreground top-2 h-0 whitespace-nowrap'>Shipping info</div>
            </div>
          </div>
          {steps[currentStep - 1]}
        </div>
      </Main>
    </div>
  )
})

export default Checkout
