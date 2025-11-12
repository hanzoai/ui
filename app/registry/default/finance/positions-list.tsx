'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

export interface Position {
  symbol: string
  shares: number
  avgPrice: number
  currentPrice: number
}

export interface PositionsListProps {
  positions: Position[]
  onPositionClick?: (position: Position) => void
}

export function PositionsList({ positions, onPositionClick }: PositionsListProps) {
  const getTickerFromSymbol = (symbol: string) => {
    return symbol.split(':')[1] || symbol
  }

  if (positions.length === 0) {
    return (
      <div className="p-4 text-center py-8 text-white/40">
        <p className="text-sm">No open positions</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-2">
      {positions.map((position) => {
        const pl = (position.currentPrice - position.avgPrice) * position.shares
        const plPercent = ((position.currentPrice - position.avgPrice) / position.avgPrice) * 100
        const totalValue = position.currentPrice * position.shares

        return (
          <div 
            key={position.symbol} 
            className={`bg-white/5 rounded-lg p-3 ${onPositionClick ? 'cursor-pointer hover:bg-white/10 transition-colors' : ''}`}
            onClick={() => onPositionClick?.(position)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-white">
                {getTickerFromSymbol(position.symbol)}
              </div>
              <div className={`flex items-center gap-1 text-sm ${pl >= 0 ? 'text-success' : 'text-danger'}`}>
                {pl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {pl >= 0 ? '+' : ''}{plPercent.toFixed(2)}%
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-white/60">Shares</div>
                <div className="text-white font-medium">{position.shares}</div>
              </div>
              <div>
                <div className="text-white/60">Avg Price</div>
                <div className="text-white font-medium">${position.avgPrice.toFixed(2)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mt-2 pt-2 border-t border-white/10">
              <div>
                <div className="text-white/60">Current Price</div>
                <div className="text-white font-medium">${position.currentPrice.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-white/60">Total Value</div>
                <div className="text-white font-medium">${totalValue.toFixed(2)}</div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-white/10">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">P&L</span>
                <span className={`font-semibold ${pl >= 0 ? 'text-success' : 'text-danger'}`}>
                  {pl >= 0 ? '+' : ''}${pl.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
