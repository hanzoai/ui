"use client"

import { TradingPanel } from "@hanzo/ui/finance"

export default function TradingPanelDemo() {
  return <TradingPanel symbol="NASDAQ:AAPL" currentPrice={175.5} />
}
