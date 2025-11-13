"use client"

import { useState } from "react"
import { AdvancedChart } from "@/registry/default/ui/advanced-chart"
// import { CompanyProfile } from "@/registry/default/ui/company-profile" // TODO: Create this component
// import { CryptoScreener } from "@/registry/default/ui/crypto-screener" // TODO: Create this component
// import { Financials } from "@/registry/default/ui/financials" // TODO: Create this component
// import { ForexScreener } from "@/registry/default/ui/forex-screener" // TODO: Create this component
// import { MarketOverview } from "@/registry/default/ui/market-overview" // TODO: Create this component
// import { NewsTimeline } from "@/registry/default/ui/news-timeline" // TODO: Create this component
// import { OrderEntry } from "@/registry/default/ui/order-entry" // TODO: Create this component
// import { OrdersHistory } from "@/registry/default/ui/orders-history" // TODO: Create this component
// import { PositionsList } from "@/registry/default/ui/positions-list" // TODO: Create this component
import { StockScreener } from "@/registry/default/ui/stock-screener"
// import { SymbolInfo } from "@/registry/default/ui/symbol-info" // TODO: Create this component
// import { TechnicalAnalysis } from "@/registry/default/ui/technical-analysis" // TODO: Create this component
// import { TickerTape } from "@/registry/default/ui/ticker-tape" // TODO: Create this component
import { TradingPanel } from "@/registry/default/ui/trading-panel"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card"
import { Separator } from "@/registry/default/ui/separator"

export default function FinancePage() {
  const [positions, setPositions] = useState([
    {
      symbol: "NASDAQ:AAPL",
      shares: 10,
      avgPrice: 150,
      currentPrice: 175,
    },
  ])

  const [orders, setOrders] = useState<
    Array<{
      id: string
      symbol: string
      type: "buy" | "sell"
      shares: number
      price: number
      status: "open" | "filled" | "cancelled" | "pending"
      timestamp: number
    }>
  >([
    {
      id: "1",
      symbol: "NASDAQ:AAPL",
      type: "buy",
      shares: 10,
      price: 150,
      status: "filled",
      timestamp: Date.now() - 86400000,
    },
  ])

  const handlePlaceOrder = (order: any) => {
    const newOrder = {
      id: String(Date.now()),
      symbol: order.symbol,
      type: order.side as "buy" | "sell",
      shares: order.shares,
      price: order.limitPrice || 0,
      status: "pending" as "open" | "filled" | "cancelled" | "pending",
      timestamp: Date.now(),
    }
    setOrders([newOrder, ...orders])
    console.log("Order placed:", order)
  }

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Finance Components
          </h1>
          <p className="text-muted-foreground mt-2">
            TradingView-powered widgets and trading interface components. Copy
            and paste into your financial applications.
          </p>
        </div>

        <Separator />

        {/* TradingView Charts */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">TradingView Charts</h2>
            <p className="text-sm text-muted-foreground">
              Interactive financial charts and market data
            </p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Chart</CardTitle>
                <CardDescription>
                  Full-featured interactive chart with symbol switching
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ height: "500px" }}>
                  <AdvancedChart symbol="NASDAQ:AAPL" />
                </div>
              </CardContent>
            </Card>

            {/* TODO: Add TickerTape and MarketOverview components */}
          </div>
        </section>

        <Separator />

        {/* Market Screeners */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Market Screeners</h2>
            <p className="text-sm text-muted-foreground">
              Asset screeners for stocks (crypto and forex coming soon)
            </p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Stock Screener</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ height: "400px" }}>
                  <StockScreener />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Trading Interface */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Trading Interface</h2>
            <p className="text-sm text-muted-foreground">
              Trading panel component (order entry and position management coming soon)
            </p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Trading Panel</CardTitle>
                <CardDescription>
                  Demo trading panel with portfolio tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TradingPanel symbol="NASDAQ:AAPL" currentPrice={175} />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
