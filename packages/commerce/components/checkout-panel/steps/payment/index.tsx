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

import { useCommerce } from '../../../../service/context'
import type { TransactionStatus } from '../../../../types'
import { sendFBEvent, sendGAEvent } from '../../../../util/analytics'

import type { StepComponentProps } from '../types'

const contactFormSchema = z.object({
  name: z.string().min(1, 'Enter your full name.'),
  email: z.string().email(),
})

const Payment: React.FC<StepComponentProps> = observer(({
  onDone,
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
          item_category: item.categoryId,
          price: item.price,
          quantity: item.quantity
        })),
        value: cmmc.cartTotal,
        currency: 'USD',
        payment_type: paymentInfo.paymentMethod ?? ''
      })
      sendFBEvent('AddPaymentInfo', {
        contents: cmmc.cartItems.map(item => ({
          id: item.sku,
          quantity: item.quantity
        })),
        value: cmmc.cartTotal,
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

  return (
    <Tabs defaultValue='card' className='w-full sm:max-w-[500px] sm:mx-auto'>
      <TabsList className={groupClx}>
        <TabsTrigger
          value='card'
          className={tabClx}
          disabled={transactionStatus === 'paid' || transactionStatus === 'confirmed'}
        >
          Card
        </TabsTrigger>
        <TabsTrigger
          value='crypto'
          className={tabClx}
          disabled={transactionStatus === 'paid' || transactionStatus === 'confirmed'}
        >
          Wallet
        </TabsTrigger>
        <TabsTrigger
          value='bank'
          className={tabClx}
          disabled={transactionStatus === 'paid' || transactionStatus === 'confirmed'}
        >
          Bank Wire
        </TabsTrigger>
      </TabsList>
      <TabsContent value='card'>
        <PayWithCard
          onDone={onDone}
          transactionStatus={transactionStatus}
          setTransactionStatus={setTransactionStatus}
          storePaymentInfo={storePaymentInfo}
          contactForm={contactForm}
        />
      </TabsContent>
      <TabsContent value='crypto'>
        <PayWithCrypto
          onDone={onDone}
          transactionStatus={transactionStatus}
          setTransactionStatus={setTransactionStatus}
          storePaymentInfo={storePaymentInfo}
          contactForm={contactForm}
        />
      </TabsContent>
      <TabsContent value='bank'>
        <PayWithBankTransfer
          onDone={onDone}
          storePaymentInfo={storePaymentInfo}
          contactForm={contactForm}
        />
      </TabsContent>
    </Tabs>
  )
})

export default Payment
