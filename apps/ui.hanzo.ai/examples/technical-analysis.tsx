import { useState } from "react"
import { XStack, YStack } from "@hanzo/gui"
import { Button, TechnicalAnalysis } from "@hanzo/ui"

/** Default — TradingView's summary gauge and indicator tables for one symbol, daily bars, dark, 450px tall and as wide as its parent. */
export function Default() {
  return <TechnicalAnalysis symbol="NASDAQ:AAPL" />
}

/** Light and compact — `colorTheme="light"` takes the widget's light palette, `displayMode="single"` collapses it to the one summary gauge. */
export function LightAndCompact() {
  return (
    <TechnicalAnalysis
      symbol="BINANCE:BTCUSDT"
      colorTheme="light"
      displayMode="single"
      height={220}
      rounded="$3"
    />
  )
}

/** Several symbols — each widget is its own frame, so a column of them stacks like any other boxes. */
export function SeveralSymbols() {
  return (
    <YStack gap="$4">
      <TechnicalAnalysis symbol="NASDAQ:AAPL" height={300} showIntervalTabs={false} />
      <TechnicalAnalysis symbol="NASDAQ:GOOGL" height={300} showIntervalTabs={false} />
    </YStack>
  )
}

/** Controlled — `symbol` and `interval` come from state; a change opens the widget afresh at the new address. */
export function Controlled() {
  const symbols = ["NASDAQ:AAPL", "NASDAQ:MSFT", "BINANCE:ETHUSDT"]
  const intervals = ["15m", "1h", "1D", "1W"] as const
  const [symbol, setSymbol] = useState(symbols[0])
  const [span, setSpan] = useState<(typeof intervals)[number]>("1D")
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
      <XStack gap="$2">
        {intervals.map((i) => (
          <Button
            key={i}
            size="sm"
            variant={i === span ? "primary" : "outline"}
            onPress={() => setSpan(i)}
          >
            {i}
          </Button>
        ))}
      </XStack>
      <TechnicalAnalysis symbol={symbol} interval={span} displayMode="multiple" height={520} />
    </YStack>
  )
}
