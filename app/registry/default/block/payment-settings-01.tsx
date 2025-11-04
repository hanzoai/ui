"use client"

import * as React from "react"

export const description =
  "A payment settings interface for managing payment methods, billing preferences, and subscription details."

export const iframeHeight = "800px"

export const containerClassName = "w-full"

export default function BlockPaymentSettings01() {
  return (
    <div className="flex min-h-[600px] items-center justify-center p-8">
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold">Payment Settings Block</p>
        <p className="text-sm text-muted-foreground">
          This block requires @hanzo/ui/billing package
        </p>
        <p className="text-xs text-muted-foreground">
          Install: npm install @hanzo/ui
        </p>
      </div>
    </div>
  )
}
