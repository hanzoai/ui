"use client"

import * as React from "react"

export const description =
  "A comprehensive subscription portal for managing subscriptions, viewing usage, and handling retention offers."

export const iframeHeight = "900px"

export const containerClassName = "w-full"

export default function BlockSubscriptionPortal01() {
  return (
    <div className="flex min-h-[600px] items-center justify-center p-8">
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold">Subscription Portal Block</p>
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
