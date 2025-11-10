"use client"

import { OrdersHistory } from "@hanzo/ui/finance"

const sampleOrders = [
  {
    id: "1",
    symbol: "NASDAQ:AAPL",
    type: "buy" as const,
    shares: 100,
    price: 175.5,
    status: "filled" as const,
    timestamp: Date.now() - 3600000,
    orderType: "market" as const,
  },
  {
    id: "2",
    symbol: "NYSE:TSLA",
    type: "sell" as const,
    shares: 25,
    price: 195.75,
    status: "open" as const,
    timestamp: Date.now() - 7200000,
    orderType: "limit" as const,
  },
  {
    id: "3",
    symbol: "NASDAQ:MSFT",
    type: "buy" as const,
    shares: 50,
    price: 350.25,
    status: "pending" as const,
    timestamp: Date.now() - 1800000,
    orderType: "market" as const,
  },
]

export default function OrdersHistoryDemo() {
  return (
    <OrdersHistory
      orders={sampleOrders}
      onCancelOrder={(orderId) => {
        console.log("Cancel order:", orderId)
      }}
      onOrderClick={(order) => {
        console.log("Order clicked:", order)
      }}
    />
  )
}
