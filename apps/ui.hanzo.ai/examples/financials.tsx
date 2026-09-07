import { useState } from "react"
import { XStack, YStack } from "@hanzo/gui"
import { Button, Financials } from "@hanzo/ui"

/** Default — TradingView's full financial statements for one symbol, adaptive layout, dark, 800px tall and as wide as its parent. */
export function Default() {
  return <Financials symbol="NASDAQ:AAPL" displayMode="adaptive" />
}

/** Compact and light — `displayMode="compact"` narrows the statements to headline rows, and `colorTheme="light"` takes the widget's light palette. */
export function CompactAndLight() {
  return (
    <Financials
      symbol="BINANCE:BTCUSDT"
      displayMode="compact"
      colorTheme="light"
      height={500}
      rounded="$3"
    />
  )
}

/** Several symbols — each widget is its own frame, so a column of them stacks like any other boxes. */
export function SeveralSymbols() {
  return (
    <YStack gap="$4">
      <Financials symbol="NASDAQ:AAPL" displayMode="compact" height={400} />
      <Financials symbol="NASDAQ:GOOGL" displayMode="compact" height={400} />
    </YStack>
  )
}

/** Controlled — `symbol` comes from state; a change opens the statements afresh at the new address. */
export function Controlled() {
  const symbols = ["NASDAQ:AAPL", "NASDAQ:MSFT", "BINANCE:ETHUSDT"]
  const [symbol, setSymbol] = useState(symbols[0])
  return (
    <YStack gap="$3">
      <XStack gap="$2" flexWrap="wrap">
        {symbols.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={s === symbol ? "primary" : "outline"}
            onPress={() => setSymbol(s)}
          >
            {s}
          </Button>
        ))}
      </XStack>
      <Financials symbol={symbol} displayMode="compact" height={500} />
    </YStack>
  )
}
