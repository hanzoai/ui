"use client"

import { PositionsList } from "@hanzo/ui/finance"

const samplePositions = [
  {
    symbol: "NASDAQ:AAPL",
    shares: 100,
    avgPrice: 150.25,
    currentPrice: 175.5,
  },
  {
    symbol: "NYSE:TSLA",
    shares: 50,
    avgPrice: 220.0,
    currentPrice: 195.75,
  },
  {
    symbol: "NASDAQ:MSFT",
    shares: 75,
    avgPrice: 310.5,
    currentPrice: 350.25,
  },
]

export default function PositionsListDemo() {
  return (
    <PositionsList
      positions={samplePositions}
      onPositionClick={(position) => {
        console.log("Position clicked:", position)
      }}
    />
  )
}
