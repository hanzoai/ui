import { useState } from "react"
import { XStack, YStack } from "@hanzo/gui"
import { AdvancedChart, Button } from "@hanzo/ui"

/** Default — TradingView's full chart of one symbol, daily bars, dark, 500px tall and as wide as its parent; the chart's own toolbars switch symbol and timeframe. */
export function Default() {
  return <AdvancedChart symbol="NASDAQ:AAPL" />
}

/** Light and bare — `theme="light"` takes the chart's light palette, `height` sets the frame, and `hideTopToolbar` leaves only the candles and the side tools. */
export function LightAndBare() {
  return (
    <AdvancedChart
      symbol="BINANCE:BTCUSDT"
      theme="light"
      height={400}
      hideTopToolbar
      rounded="$3"
    />
  )
}

/** Several symbols — each chart is its own frame, so a column of them stacks like any other boxes. */
export function SeveralSymbols() {
  return (
    <YStack gap="$4">
      <AdvancedChart symbol="NASDAQ:AAPL" height={320} hideSideToolbar />
      <AdvancedChart symbol="NASDAQ:GOOGL" height={320} hideSideToolbar />
    </YStack>
  )
}

/** Controlled — `symbol` and `interval` come from state; a change opens the chart afresh at the new address. */
export function Controlled() {
  const symbols = ["NASDAQ:AAPL", "NASDAQ:MSFT", "BINANCE:ETHUSDT"]
  const intervals = ["15", "60", "D", "W"] as const
  const [symbol, setSymbol] = useState(symbols[0])
  const [span, setSpan] = useState<(typeof intervals)[number]>("D")
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
      <AdvancedChart symbol={symbol} interval={span} height={420} />
    </YStack>
  )
}
