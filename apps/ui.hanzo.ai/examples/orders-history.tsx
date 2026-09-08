import { OrdersHistory } from "@hanzo/ui"
import type { Order } from "@hanzo/ui"

const orders: Order[] = [
  {
    id: "1",
    symbol: "NASDAQ:AAPL",
    type: "buy",
    shares: 100,
    price: 175.5,
    status: "open",
    timestamp: Date.parse("2024-06-03T14:22:00Z"),
    orderType: "limit",
  },
  {
    id: "2",
    symbol: "NASDAQ:MSFT",
    type: "sell",
    shares: 25,
    price: 415.2,
    status: "filled",
    timestamp: Date.parse("2024-06-03T13:05:00Z"),
  },
  {
    id: "3",
    symbol: "NASDAQ:TSLA",
    type: "buy",
    shares: 10,
    price: 0,
    status: "pending",
    timestamp: Date.parse("2024-06-03T12:40:00Z"),
    orderType: "market",
  },
  {
    id: "4",
    symbol: "NASDAQ:GOOG",
    type: "sell",
    shares: 5,
    price: 140.1,
    status: "cancelled",
    timestamp: Date.parse("2024-06-02T09:15:00Z"),
  },
]

/** Default — every order status rendered, with the status filter row above the list. */
export function Default() {
  return <OrdersHistory orders={orders} />
}

/** Without filters — `showFilters={false}` drops the status filter row, leaving only the list. */
export function WithoutFilters() {
  return <OrdersHistory orders={orders} showFilters={false} />
}

/** Cancellable — a handler on an open order shows a Cancel Order button that removes it from the list. */
export function Cancellable() {
  return (
    <OrdersHistory
      orders={orders}
      onCancelOrder={(orderId) => console.log("cancel", orderId)}
    />
  )
}

/** Empty — no orders yields a centered No orders yet message instead of a blank list. */
export function Empty() {
  return <OrdersHistory orders={[]} />
}
