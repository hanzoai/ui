"use client"

import { useEffect, useState } from "react"
import { TrendingDown, TrendingUp } from "lucide-react"

export interface TradingPanelProps {
  symbol: string
  currentPrice: number
}

export function TradingPanel({ symbol, currentPrice }: TradingPanelProps) {
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy")
  const [quantity, setQuantity] = useState("")
  const [portfolio, setPortfolio] = useState<any>(null)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  useEffect(() => {
    loadPortfolio()
  }, [])

  const loadPortfolio = () => {
    const storedPortfolio = localStorage.getItem("begm_portfolio")
    if (storedPortfolio) {
      setPortfolio(JSON.parse(storedPortfolio))
    } else {
      const initialPortfolio = {
        cash: 100000,
        holdings: [],
      }
      localStorage.setItem("begm_portfolio", JSON.stringify(initialPortfolio))
      setPortfolio(initialPortfolio)
    }
  }

  const executeTrade = () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      setMessage({ type: "error", text: "Please enter a valid quantity" })
      return
    }

    const qty = parseFloat(quantity)
    const total = qty * currentPrice

    if (orderType === "buy") {
      // Check if user has enough cash
      if (total > portfolio.cash) {
        setMessage({ type: "error", text: "Insufficient funds" })
        return
      }

      // Update portfolio
      const existingHolding = portfolio.holdings.find(
        (h: any) => h.symbol === symbol
      )
      if (existingHolding) {
        // Update existing holding
        const newQuantity = existingHolding.quantity + qty
        const newAveragePrice =
          (existingHolding.averagePrice * existingHolding.quantity +
            currentPrice * qty) /
          newQuantity
        existingHolding.quantity = newQuantity
        existingHolding.averagePrice = newAveragePrice
        existingHolding.currentPrice = currentPrice
      } else {
        // Add new holding
        portfolio.holdings.push({
          symbol,
          quantity: qty,
          averagePrice: currentPrice,
          currentPrice,
        })
      }

      portfolio.cash -= total
    } else {
      // Selling
      const existingHolding = portfolio.holdings.find(
        (h: any) => h.symbol === symbol
      )

      if (!existingHolding || existingHolding.quantity < qty) {
        setMessage({ type: "error", text: "Insufficient shares" })
        return
      }

      // Update holding
      existingHolding.quantity -= qty
      existingHolding.currentPrice = currentPrice

      // Remove holding if quantity is 0
      if (existingHolding.quantity === 0) {
        portfolio.holdings = portfolio.holdings.filter(
          (h: any) => h.symbol !== symbol
        )
      }

      portfolio.cash += total
    }

    // Save updated portfolio
    localStorage.setItem("begm_portfolio", JSON.stringify(portfolio))
    setPortfolio({ ...portfolio })

    // Record order
    const orders = JSON.parse(localStorage.getItem("begm_orders") || "[]")
    orders.push({
      id: `ORD-${Date.now()}`,
      symbol,
      type: orderType,
      quantity: qty,
      price: currentPrice,
      total,
      timestamp: new Date().toISOString(),
      status: "completed",
    })
    localStorage.setItem("begm_orders", JSON.stringify(orders))

    setMessage({
      type: "success",
      text: `Successfully ${orderType === "buy" ? "bought" : "sold"} ${qty} shares of ${symbol}`,
    })
    setQuantity("")

    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000)
  }

  const getHoldingInfo = () => {
    if (!portfolio) return null
    const holding = portfolio.holdings.find((h: any) => h.symbol === symbol)
    return holding
  }

  const holding = getHoldingInfo()

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6 backdrop-blur-xl">
      <h3 className="text-lg font-bold text-white mb-4">Trade {symbol}</h3>

      {/* Order Type Selection */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setOrderType("buy")}
          className={`flex-1 py-2 rounded-lg font-medium transition-all ${
            orderType === "buy"
              ? "bg-success text-white"
              : "bg-white/5 text-white/60 hover:bg-white/10"
          }`}
        >
          <TrendingUp size={16} className="inline mr-2" />
          Buy
        </button>
        <button
          onClick={() => setOrderType("sell")}
          className={`flex-1 py-2 rounded-lg font-medium transition-all ${
            orderType === "sell"
              ? "bg-danger text-white"
              : "bg-white/5 text-white/60 hover:bg-white/10"
          }`}
        >
          <TrendingDown size={16} className="inline mr-2" />
          Sell
        </button>
      </div>

      {/* Current Holdings Info */}
      {holding && (
        <div className="mb-4 p-3 bg-white/5 rounded-lg">
          <p className="text-xs text-white/60 mb-1">Your Holdings</p>
          <p className="text-sm text-white">
            {holding.quantity} shares @ ${holding.averagePrice.toFixed(2)} avg
          </p>
        </div>
      )}

      {/* Price Info */}
      <div className="mb-4 p-3 bg-white/5 rounded-lg">
        <p className="text-xs text-white/60 mb-1">Current Price</p>
        <p className="text-lg font-bold text-white">
          ${currentPrice.toFixed(2)}
        </p>
      </div>

      {/* Quantity Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-white/80 mb-2">
          Quantity (Shares)
        </label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="1"
          step="1"
          placeholder="Enter quantity"
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-success"
        />
      </div>

      {/* Order Total */}
      {quantity && parseFloat(quantity) > 0 && (
        <div className="mb-4 p-3 bg-white/5 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/60">Estimated Total</span>
            <span className="text-lg font-bold text-white">
              ${(parseFloat(quantity) * currentPrice).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Available Cash */}
      <div className="mb-4 p-3 bg-white/5 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-white/60">Available Cash</span>
          <span className="text-sm font-medium text-white">
            ${portfolio?.cash.toLocaleString() || "0"}
          </span>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            message.type === "success"
              ? "bg-success/20 text-success"
              : "bg-danger/20 text-danger"
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Execute Button */}
      <button
        onClick={executeTrade}
        className={`w-full py-3 rounded-lg font-medium transition-all ${
          orderType === "buy"
            ? "bg-success hover:bg-success/90 text-white"
            : "bg-danger hover:bg-danger/90 text-white"
        }`}
      >
        {orderType === "buy" ? "Buy" : "Sell"} {symbol}
      </button>

      <p className="text-xs text-white/40 text-center mt-4">
        This is a demo account. No real money is at risk.
      </p>
    </div>
  )
}

export default TradingPanel
