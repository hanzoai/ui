import { useState } from "react"
import { XStack, YStack } from "@hanzo/gui"
import { Button, SymbolInfo } from "@hanzo/ui"

/** Default — TradingView's price and key stats for one symbol, dark and as wide as its parent. */
export function Default() {
  return <SymbolInfo symbol="NASDAQ:AAPL" />
}

/** Light and transparent — `colorTheme="light"` takes the widget's light palette and `isTransparent` drops its background so the app's own shows through. */
export function LightAndTransparent() {
  return <SymbolInfo symbol="NASDAQ:MSFT" colorTheme="light" isTransparent rounded="$3" />
}

/** Several symbols — each info card is its own frame, so a column of them stacks like any other boxes. */
export function SeveralSymbols() {
  return (
    <YStack gap="$4">
      <SymbolInfo symbol="NASDAQ:AAPL" />
      <SymbolInfo symbol="BINANCE:ETHUSDT" />
    </YStack>
  )
}

/** Controlled — `symbol` comes from state; a change opens the card afresh at the new address. */
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
      <SymbolInfo symbol={symbol} />
    </YStack>
  )
}
