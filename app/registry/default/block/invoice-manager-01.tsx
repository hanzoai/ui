"use client"

import * as React from "react"

export const description =
  "A complete invoice management interface with list/card views, filtering, sorting, pagination, and PDF download functionality. Features responsive design with mobile-optimized layouts."

export const iframeHeight = "900px"

export const containerClassName = "w-full"

export default function BlockInvoiceManager01() {
  return (
    <div className="flex min-h-[600px] items-center justify-center p-8">
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold">Invoice Manager Block</p>
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
