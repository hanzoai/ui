"use client"

import { OrderEntry } from "@hanzo/ui/finance"

export default function OrderEntryDemo() {
  return (
    <OrderEntry
      symbol="NASDAQ:AAPL"
      accountBalance={50000}
      onPlaceOrder={(order) => {
        console.log("Order placed:", order)
      }}
    />
  )
}
