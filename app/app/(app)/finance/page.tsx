"use client"

import { useState } from "react"
import {
  AdvancedChart,
  CompanyProfile,
  CryptoScreener,
  Financials,
  ForexScreener,
  MarketOverview,
  NewsTimeline,
  OrderEntry,
  OrdersHistory,
  PositionsList,
  StockScreener,
  SymbolInfo,
  TechnicalAnalysis,
  TickerTape,
  TradingPanel,
} from "@hanzo/ui/finance"

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

            <Card>
              <CardHeader>
                <CardTitle>Ticker Tape</CardTitle>
                <CardDescription>
                  Scrolling ticker with major market indices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TickerTape />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Overview</CardTitle>
                <CardDescription>
                  Multi-asset market overview with tabs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ height: "450px" }}>
                  <MarketOverview />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Market Screeners */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Market Screeners</h2>
            <p className="text-sm text-muted-foreground">
              Asset screeners for stocks, crypto, and forex
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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

            <Card>
              <CardHeader>
                <CardTitle>Crypto Screener</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ height: "400px" }}>
                  <CryptoScreener />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Forex Screener</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ height: "400px" }}>
                  <ForexScreener />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Symbol Analysis */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Symbol Analysis</h2>
            <p className="text-sm text-muted-foreground">
              Comprehensive symbol information and analysis tools
            </p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Symbol Info</CardTitle>
                <CardDescription>
                  Real-time symbol details and price information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ height: "140px" }}>
                  <SymbolInfo symbol="NASDAQ:AAPL" />
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ height: "400px" }}>
                    <CompanyProfile symbol="NASDAQ:AAPL" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Technical Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ height: "400px" }}>
                    <TechnicalAnalysis symbol="NASDAQ:AAPL" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Financials</CardTitle>
                <CardDescription>
                  Financial statements and fundamental data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ height: "500px" }}>
                  <Financials symbol="NASDAQ:AAPL" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* News */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">News & Timeline</h2>
            <p className="text-sm text-muted-foreground">
              Financial news feed and updates
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>News Timeline</CardTitle>
              <CardDescription>Real-time financial news feed</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: "400px" }}>
                <NewsTimeline />
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Trading Interface */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Trading Interface</h2>
            <p className="text-sm text-muted-foreground">
              Order entry, positions, and order management components
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

            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Order Entry</CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderEntry
                    symbol="NASDAQ:AAPL"
                    accountBalance={10000}
                    onPlaceOrder={handlePlaceOrder}
                  />
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Positions</CardTitle>
                </CardHeader>
                <CardContent>
                  <PositionsList positions={positions} />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Orders History</CardTitle>
              </CardHeader>
              <CardContent>
                <OrdersHistory
                  orders={orders}
                  onCancelOrder={(id) => {
                    setOrders(
                      orders.map((o) =>
                        o.id === id ? { ...o, status: "cancelled" } : o
                      )
                    )
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
