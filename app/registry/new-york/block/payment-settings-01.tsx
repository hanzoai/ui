"use client"

import { PaymentMethodManager, type PaymentMethod } from "@/registry/new-york/ui/billing"

export const description =
  "Payment method management interface for adding, removing, and setting default payment methods."

export const iframeHeight = "800px"

export const containerClassName = "w-full"

// Demo payment methods for showcase
const demoPaymentMethods: PaymentMethod[] = [
  {
    id: "pm_1",
    type: "Visa",
    last4: "4242",
    expiryDate: "12/2025",
    isDefault: true,
  },
  {
    id: "pm_2",
    type: "Mastercard",
    last4: "5555",
    expiryDate: "08/2026",
    isDefault: false,
  },
  {
    id: "pm_3",
    type: "PayPal",
    last4: "john@example.com",
    expiryDate: "N/A",
    isDefault: false,
  },
]

export default function PaymentSettings01() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <PaymentMethodManager />
    </div>
  )
}
