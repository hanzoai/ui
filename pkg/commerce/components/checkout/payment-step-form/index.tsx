'use client'
import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'

import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useForm } from 'react-hook-form'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@hanzo/ui/primitives'
import { useAuth } from '@hanzo/auth/service'

import { useCommerce } from '../../../service/context'
import { sendFBEvent, sendGAEvent } from '../../../util/analytics'
import type { CheckoutStepComponentProps, TransactionStatus } from '../../../types'

import METHODS from './methods'

const contactFormSchema = z.object({
  name: z.string().min(1, 'Enter your full name.'),
  email: z.string().email(),
})

const PaymentStepForm: React.FC<CheckoutStepComponentProps> = observer(({
  onDone,
  orderId,
  setOrderId
}) => {
  const cmmc = useCommerce()
  const auth = useAuth() // may be null in some cases

  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('unpaid')

  if (!auth) {
    console.log("PAYMENT STEP FORM:  auth service is null! ")
  }

  const contactForm = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema as any),
    defaultValues: {
      name: auth?.user?.displayName ?? '',
      email: auth?.user?.email ?? '',
    },
  })

  useEffect(() => {
    if (auth?.loggedIn) {
      contactForm.setValue('name', auth!.user?.displayName ?? '')
      contactForm.setValue('email', auth!.user?.email ?? '')
    }
  }, [auth?.loggedIn])

  const storePaymentInfo = async (paymentInfo: any) => {
    const {name, email} = contactForm.getValues()
    let id: string | undefined = undefined
    if (!orderId) {
      id = await cmmc.createOrder(email, name)
      setOrderId(id)
    }
    if (id) {
      sendGAEvent('add_payment_info', {
        items: cmmc.cartItems.map((item) => ({
          item_id: item.sku,
          item_name: item.title,
          item_category: item.familyId,
          price: item.price,
          quantity: item.quantity
        })),
        value: cmmc.promoAppliedCartTotal,
        currency: 'USD',
        payment_type: paymentInfo.paymentMethod ?? ''
      })
      sendFBEvent('AddPaymentInfo', {
        contents: cmmc.cartItems.map(item => ({
          id: item.sku,
          quantity: item.quantity
        })),
        value: cmmc.promoAppliedCartTotal,
        currency: 'USD'
      })
      await cmmc.updateOrderPaymentInfo(id, paymentInfo)
    }
  }

  const groupClx = 'grid w-full grid-cols-3 mx-auto ' + 
    'p-0 h-auto overflow-hidden ' + 
    'border-2 bg-background border-level-2 md:bg-level-1 md:border-level-3 ' 

  const tabClx = 'whitespace-normal h-full text-xs sm:text-base px-1 text-muted ' + 
    'data-[state=active]:text-accent data-[state=active]:bg-level-2 md:data-[state=active]:bg-level-3'

  const disabled = transactionStatus === 'paid' || transactionStatus === 'confirmed'

  return (
    <Tabs defaultValue='card' className='w-full'>
      <TabsList className={groupClx}>
      {METHODS.map(({ label, value }) => (
        <TabsTrigger
          value={value}
          className={tabClx}
          disabled={disabled}
          key={`tabs-${value}`}
        >
          {label}
        </TabsTrigger>
      ))}
      </TabsList>
      {METHODS.map(({Comp: PaymentMethodComp, value}) => (
        <TabsContent value={value} key={`content-${value}`}>
          <PaymentMethodComp 
            onDone={onDone}
            transactionStatus={transactionStatus}
            setTransactionStatus={setTransactionStatus}
            storePaymentInfo={storePaymentInfo}
            contactForm={contactForm as any}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
})

export default PaymentStepForm
