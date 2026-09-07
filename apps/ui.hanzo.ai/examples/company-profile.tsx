import { useState } from "react"
import { XStack, YStack } from "@hanzo/gui"
import { Button, CompanyProfile } from "@hanzo/ui"

/** Default — TradingView's company profile for one symbol, dark, 400px tall and as wide as its parent. */
export function Default() {
  return <CompanyProfile symbol="NASDAQ:AAPL" />
}

/** Light and transparent — `colorTheme="light"` takes the widget's light palette and `isTransparent` drops its background so the app's own shows through. */
export function LightAndTransparent() {
  return (
    <CompanyProfile
      symbol="NASDAQ:MSFT"
      colorTheme="light"
      isTransparent
      height={320}
      rounded="$3"
    />
  )
}

/** Several symbols — each profile is its own frame, so a column of them stacks like any other boxes. */
export function SeveralSymbols() {
  return (
    <YStack gap="$4">
      <CompanyProfile symbol="NASDAQ:AAPL" height={320} />
      <CompanyProfile symbol="NASDAQ:GOOGL" height={320} />
    </YStack>
  )
}

/** Controlled — `symbol` comes from state; a change opens the profile afresh at the new address. */
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
      <CompanyProfile symbol={symbol} height={420} />
    </YStack>
  )
}
