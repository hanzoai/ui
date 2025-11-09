# @hanzo/finance

Financial trading widgets and components powered by TradingView for React applications.

## Features

- 📊 **Advanced Charts** - Full-featured TradingView charts with symbol switching
- 📈 **Market Overview** - Multi-asset market overview with indices, futures, bonds, and forex
- 📰 **News Timeline** - Real-time financial news and market events
- 🎯 **Market Screeners** - Pre-configured screeners for stocks, crypto, and forex
- 📉 **Ticker Tape** - Scrolling ticker showing real-time prices
- 💹 **Trading Panel** - Complete trading interface with buy/sell functionality

## Installation

```bash
pnpm add @hanzo/finance
```

## Peer Dependencies

```bash
pnpm add react react-dom lucide-react next
```

## Usage

### Advanced Chart

Full-featured TradingView chart with symbol switching:

```tsx
import { AdvancedChart } from '@hanzo/finance'

function TradingPage() {
  return <AdvancedChart symbol="NASDAQ:AAPL" />
}
```

### Market Overview

Multi-asset market overview widget:

```tsx
import { MarketOverview } from '@hanzo/finance'

function DashboardPage() {
  return <MarketOverview />
}
```

### Ticker Tape

Scrolling ticker showing real-time prices:

```tsx
import { TickerTape } from '@hanzo/finance'

function Layout() {
  return (
    <>
      <TickerTape />
      {/* Your content */}
    </>
  )
}
```

### Market Screeners

Pre-configured screeners for different asset classes:

```tsx
import { StockScreener, CryptoScreener, ForexScreener } from '@hanzo/finance'

function ScreenersPage() {
  return (
    <div>
      <h2>Stocks</h2>
      <StockScreener />
      
      <h2>Crypto</h2>
      <CryptoScreener />
      
      <h2>Forex</h2>
      <ForexScreener />
    </div>
  )
}
```

### News Timeline

Financial news and market events:

```tsx
import { NewsTimeline } from '@hanzo/finance'

function NewsPage() {
  return <NewsTimeline />
}
```

### Trading Panel

Complete trading interface with buy/sell functionality:

```tsx
import { TradingPanel } from '@hanzo/finance'

function TradePage() {
  return (
    <TradingPanel 
      symbol="AAPL"
      currentPrice={150.25}
    />
  )
}
```

## Components

### AdvancedChart

Props:
- `symbol` (string, optional): Symbol to display, default: "NASDAQ:AAPL"

### MarketOverview

No props required. Displays indices, futures, bonds, and forex markets.

### TickerTape

No props required. Shows major indices and popular stocks.

### StockScreener

No props required. Shows US stock market screener.

### CryptoScreener

No props required. Shows cryptocurrency screener.

### ForexScreener

No props required. Shows forex market screener.

### NewsTimeline

No props required. Shows latest financial news.

### TradingPanel

Props:
- `symbol` (string, required): Trading symbol
- `currentPrice` (number, required): Current price of the asset

## Styling

All components use dark mode by default and support Tailwind CSS classes. They are fully responsive and will adapt to their container size.

## License

BSD-3-Clause © Hanzo AI, Inc.
