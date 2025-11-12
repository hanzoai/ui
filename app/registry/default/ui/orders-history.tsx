"use client"

export interface Order {
  id: string
  symbol: string
  type: "buy" | "sell"
  shares: number
  price: number
  status: "open" | "filled" | "cancelled" | "pending"
  timestamp: number
  orderType?: "market" | "limit"
}

export interface OrdersHistoryProps {
  orders: Order[]
  onCancelOrder?: (orderId: string) => void
  onOrderClick?: (order: Order) => void
}

export function OrdersHistory({
  orders,
  onCancelOrder,
  onOrderClick,
}: OrdersHistoryProps) {
  const getTickerFromSymbol = (symbol: string) => {
    return symbol.split(":")[1] || symbol
  }

  if (orders.length === 0) {
    return (
      <div className="p-4 text-center py-8 text-white/40">
        <p className="text-sm">No orders yet</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-2">
      {orders.map((order) => (
        <div
          key={order.id}
          className={`bg-white/5 rounded-lg p-3 ${onOrderClick ? "cursor-pointer hover:bg-white/10 transition-colors" : ""}`}
          onClick={() => onOrderClick?.(order)}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="font-semibold text-white">
                {getTickerFromSymbol(order.symbol)}
              </div>
              <div className="text-xs text-white/60">
                {new Date(order.timestamp).toLocaleString()}
              </div>
            </div>
            <div
              className={`text-xs px-2 py-1 rounded ${
                order.status === "filled"
                  ? "bg-success/20 text-success"
                  : order.status === "cancelled"
                    ? "bg-white/10 text-white/60"
                    : order.status === "pending"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-blue-500/20 text-blue-400"
              }`}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-white/60">Side</div>
              <div
                className={`font-medium ${order.type === "buy" ? "text-success" : "text-danger"}`}
              >
                {order.type.toUpperCase()}
              </div>
            </div>
            <div>
              <div className="text-white/60">Shares</div>
              <div className="text-white font-medium">{order.shares}</div>
            </div>
            <div>
              <div className="text-white/60">Price</div>
              <div className="text-white font-medium">
                {order.price > 0 ? `$${order.price.toFixed(2)}` : "Market"}
              </div>
            </div>
          </div>
          {order.orderType && (
            <div className="mt-2 text-xs">
              <span className="text-white/60">Type: </span>
              <span className="text-white font-medium">
                {order.orderType.charAt(0).toUpperCase() +
                  order.orderType.slice(1)}
              </span>
            </div>
          )}
          {order.status === "open" && onCancelOrder && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCancelOrder(order.id)
              }}
              className="w-full mt-2 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-white/80 rounded transition-colors"
            >
              Cancel Order
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

export default OrdersHistory
