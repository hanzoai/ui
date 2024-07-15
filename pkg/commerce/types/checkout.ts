import type { ComponentType } from 'react'
import type { UseFormReturn } from 'react-hook-form'

type TransactionStatus = 'unpaid' | 'paid' | 'confirmed' | 'error'

interface CheckoutStepComponentProps {
  onDone: () => void
  orderId: string | undefined
  setOrderId: (orderId: string | undefined) => void
}

interface CheckoutStep {
  name: string  
  label?: string 
  Comp: ComponentType<CheckoutStepComponentProps>
}

type ContactFormType = UseFormReturn<{
  name: string
  email: string
}, any, {
  name: string
  email: string
}>

interface PaymentMethodComponentProps {
  onDone: () => void
  transactionStatus: TransactionStatus
  setTransactionStatus: (status: TransactionStatus) => void
  storePaymentInfo: (paymentInfo: any) => Promise<void>
  contactForm: ContactFormType
}

interface PaymentMethodDesc {
  value: string  
  label: string 
  Comp: ComponentType<PaymentMethodComponentProps>
}

export {
  type TransactionStatus,
  type CheckoutStepComponentProps,
  type CheckoutStep,
  type PaymentMethodComponentProps,
  type PaymentMethodDesc,
  type ContactFormType,
}