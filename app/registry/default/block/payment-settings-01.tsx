"use client"

import { PaymentMethodManager, type PaymentMethod } from "@hanzo/ui/billing"

export const description =
  "Payment method management interface for adding, removing, and setting default payment methods."

export const iframeHeight = "800px"

export const containerClassName = "w-full"

// Demo payment methods for showcase
const demoPaymentMethods: PaymentMethod[] = [
  {
    id: "pm_1",
    type: "card",
    is_default: true,
    created_at: "2024-01-15T10:30:00Z",
    card: {
      brand: "visa",
      last4: "4242",
      exp_month: 12,
      exp_year: 2025,
      funding: "credit",
    },
    billing_details: {
      name: "John Doe",
      address: {
        line1: "123 Main St",
        city: "San Francisco",
        state: "CA",
        postal_code: "94102",
        country: "US",
      },
    },
  },
  {
    id: "pm_2",
    type: "card",
    is_default: false,
    created_at: "2024-02-20T14:15:00Z",
    card: {
      brand: "mastercard",
      last4: "5555",
      exp_month: 8,
      exp_year: 2026,
      funding: "debit",
    },
    billing_details: {
      name: "John Doe",
    },
  },
  {
    id: "pm_3",
    type: "paypal",
    is_default: false,
    created_at: "2024-03-10T09:00:00Z",
    paypal: {
      email: "john.doe@example.com",
    },
  },
]

export default function PaymentSettings01() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <PaymentMethodManager
        // Use demo mode (no API endpoint)
        initialMethods={demoPaymentMethods}
        // Callbacks for demo
        onMethodAdded={(method) => {
          console.log("Payment method added:", method)
        }}
        onMethodRemoved={(id) => {
          console.log("Payment method removed:", id)
        }}
        onDefaultChanged={(id) => {
          console.log("Default payment method changed to:", id)
        }}
      />
    </div>
  )
}
