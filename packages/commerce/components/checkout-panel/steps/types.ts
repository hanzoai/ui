import type { ComponentType } from 'react'
 
export interface StepComponentProps {
  onDone: () => void
  orderId: string | undefined
  setOrderId: (orderId: string | undefined) => void
}

export interface CheckoutStep {
  name: string  
  label?: string 
  Comp: ComponentType<StepComponentProps>
}

