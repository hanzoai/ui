"use client"

import * as React from "react"
import { CreditCard as CreditCardIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export interface CreditCardProps extends React.HTMLAttributes<HTMLDivElement> {
  number?: string
  name?: string
  expiry?: string
  cvv?: string
  variant?: "default" | "minimal"
}

const CreditCard = React.forwardRef<HTMLDivElement, CreditCardProps>(
  (
    {
      className,
      number = "•••• •••• •••• ••••",
      name = "CARD HOLDER",
      expiry = "MM/YY",
      cvv,
      variant = "default",
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative aspect-[1.586/1] w-full max-w-sm rounded-xl p-6",
          variant === "default"
            ? "bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-2xl"
            : "border-2 bg-background",
          className
        )}
        {...props}
      >
        <div className="flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <CreditCardIcon className="h-10 w-10" />
            {cvv && (
              <div className="rounded bg-white/10 px-2 py-1 text-xs">
                CVV: {cvv}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="text-lg tracking-widest">{number}</div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs opacity-70">Card Holder</div>
                <div className="text-sm font-medium">{name}</div>
              </div>
              <div>
                <div className="text-xs opacity-70">Expires</div>
                <div className="text-sm font-medium">{expiry}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)
CreditCard.displayName = "CreditCard"

export { CreditCard }
