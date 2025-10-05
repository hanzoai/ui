'use client'

import type { PaymentMethod } from '../types'

export interface PaymentMethodManagerProps {
  paymentMethods?: PaymentMethod[]
  initialMethods?: PaymentMethod[]
  onAdd?: (method: PaymentMethod) => Promise<void>
  onRemove?: (id: string) => Promise<void>
  onSetDefault?: (id: string) => Promise<void>
  onMethodAdded?: (method: PaymentMethod) => void
  onMethodRemoved?: (id: string) => void
  onDefaultChanged?: (id: string) => void
}

export function PaymentMethodManager(props: PaymentMethodManagerProps) {
  const { paymentMethods = [] } = props

  return (
    <div className="space-y-4">
      <div className="text-2xl font-bold">Payment Methods</div>
      <div className="text-muted-foreground">
        {paymentMethods.length} payment method(s) saved
      </div>
    </div>
  )
}
