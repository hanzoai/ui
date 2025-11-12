'use client'

import { useState } from 'react'

export interface OrderEntryProps {
  symbol: string
  accountBalance: number
  onPlaceOrder: (order: {
    symbol: string
    side: 'buy' | 'sell'
    orderType: 'market' | 'limit'
    shares: number
    limitPrice?: number
  }) => void
  disabled?: boolean
}

export function OrderEntry({ 
  symbol, 
  accountBalance, 
  onPlaceOrder,
  disabled = false
}: OrderEntryProps) {
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy')
  const [shares, setShares] = useState('')
  const [limitPrice, setLimitPrice] = useState('')

  const getTickerFromSymbol = (symbol: string) => {
    return symbol.split(':')[1] || symbol
  }

  const handlePlaceOrder = () => {
    if (!shares || (orderType === 'limit' && !limitPrice)) return

    onPlaceOrder({
      symbol,
      side: orderSide,
      orderType,
      shares: parseInt(shares),
      limitPrice: orderType === 'limit' ? parseFloat(limitPrice) : undefined
    })

    // Reset form
    setShares('')
    setLimitPrice('')
  }

  return (
    <div className="p-4 space-y-4">
      {/* Account Balance */}
      <div className="bg-white/5 rounded-lg p-3">
        <div className="text-xs text-white/60 mb-1">Buying Power</div>
        <div className="text-lg font-semibold text-white">
          ${accountBalance.toLocaleString()}
        </div>
      </div>

      {/* Buy/Sell Toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setOrderSide('buy')}
          disabled={disabled}
          className={`py-2.5 rounded-lg font-semibold transition-all ${
            orderSide === 'buy'
              ? 'bg-success text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Buy
        </button>
        <button
          onClick={() => setOrderSide('sell')}
          disabled={disabled}
          className={`py-2.5 rounded-lg font-semibold transition-all ${
            orderSide === 'sell'
              ? 'bg-danger text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Sell
        </button>
      </div>

      {/* Order Type */}
      <div>
        <label className="text-xs text-white/60 mb-2 block">Order Type</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setOrderType('market')}
            disabled={disabled}
            className={`py-2 rounded-lg text-sm font-medium transition-all ${
              orderType === 'market'
                ? 'bg-white/10 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Market
          </button>
          <button
            onClick={() => setOrderType('limit')}
            disabled={disabled}
            className={`py-2 rounded-lg text-sm font-medium transition-all ${
              orderType === 'limit'
                ? 'bg-white/10 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Limit
          </button>
        </div>
      </div>

      {/* Shares */}
      <div>
        <label className="text-xs text-white/60 mb-2 block">Shares</label>
        <input
          type="number"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          disabled={disabled}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-success disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="0"
        />
      </div>

      {/* Limit Price */}
      {orderType === 'limit' && (
        <div>
          <label className="text-xs text-white/60 mb-2 block">Limit Price</label>
          <input
            type="number"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            disabled={disabled}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-success disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="0.00"
            step="0.01"
          />
        </div>
      )}

      {/* Place Order Button */}
      <button
        onClick={handlePlaceOrder}
        disabled={disabled || !shares || (orderType === 'limit' && !limitPrice)}
        className={`w-full py-3 rounded-lg font-semibold transition-all ${
          orderSide === 'buy'
            ? 'bg-success hover:bg-success/90 text-white'
            : 'bg-danger hover:bg-danger/90 text-white'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {orderSide === 'buy' ? 'Buy' : 'Sell'} {getTickerFromSymbol(symbol)}
      </button>
    </div>
  )
}
