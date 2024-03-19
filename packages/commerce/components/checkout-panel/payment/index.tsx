'use client'

import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'

import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useForm } from 'react-hook-form'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@hanzo/ui/primitives'
import { useAuth } from '@hanzo/auth/service'
import PayWithCrypto from './pay-with-crypto'
import PayWithBankTransfer from './pay-with-bank-transfer'
import PayWithCard from './pay-with-card'
import { useCommerce } from '../../../service/context'
import type { TransactionStatus } from '../../../types'

const contactFormSchema = z.object({
  name: z.string().min(1, 'Enter your full name.'),
  email: z.string().email(),
})

const Payment: React.FC<{
  setStep: (s: number) => void
  orderId?: string
  setOrderId: (orderId?: string) => void
}> = observer(({
  setStep,
  orderId,
  setOrderId
}) => {
  const cmmc = useCommerce()
  const auth = useAuth()
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('unpaid')

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

  const storePaymentInfo = async (paymentInfo: any) => {
    const {name, email} = contactForm.getValues()
    let id
    if (!orderId) {
      id = await cmmc.createOrder(email, name)
      setOrderId(id)
    }
    if (id) {
      await cmmc.updateOrderPaymentInfo(id, paymentInfo)
    }
  }

  return (
    <Tabs defaultValue='card' className='w-full mx-auto max-w-[50rem]'>
      <TabsList className='grid w-full grid-cols-3 mx-auto bg-level-2 h-auto'>
        <TabsTrigger
          value='card'
          className='whitespace-normal h-full text-sm sm:text-base'
          disabled={transactionStatus === 'paid' || transactionStatus === 'confirmed'}
        >
          PAY WITH CARD
        </TabsTrigger>
        <TabsTrigger
          value='crypto'
          className='whitespace-normal h-full text-sm sm:text-base'
          disabled={transactionStatus === 'paid' || transactionStatus === 'confirmed'}
        >
          PAY WITH CRYPTO
        </TabsTrigger>
        <TabsTrigger
          value='bank'
          className='whitespace-normal h-full text-sm sm:text-base'
          disabled={transactionStatus === 'paid' || transactionStatus === 'confirmed'}
        >
          BANK TRANSFER
        </TabsTrigger>
      </TabsList>
      <TabsContent value='card'>
        <PayWithCard
          setStep={setStep}
          transactionStatus={transactionStatus}
          setTransactionStatus={setTransactionStatus}
          storePaymentInfo={storePaymentInfo}
          contactForm={contactForm}
        />
      </TabsContent>
      <TabsContent value='crypto'>
        <PayWithCrypto
          setStep={setStep}
          transactionStatus={transactionStatus}
          setTransactionStatus={setTransactionStatus}
          storePaymentInfo={storePaymentInfo}
          contactForm={contactForm}
        />
      </TabsContent>
      <TabsContent value='bank'>
        <PayWithBankTransfer
          setStep={setStep}
          storePaymentInfo={storePaymentInfo}
          contactForm={contactForm}
        />
      </TabsContent>
    </Tabs>
  )
})

export default Payment
