"use client"

import { InvoiceManager } from "@/registry/new-york/ui/billing"

export const description =
  "A complete invoice management interface with list/card views, filtering, sorting, pagination, and PDF download functionality. Features responsive design with mobile-optimized layouts."

export const iframeHeight = "900px"

export const containerClassName = "w-full"

export default function InvoiceManagerDemo() {
  return (
    <div className="container mx-auto py-8">
      <InvoiceManager />
    </div>
  )
}
