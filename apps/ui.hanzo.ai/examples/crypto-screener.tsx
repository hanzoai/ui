import { YStack } from "@hanzo/gui"
import { CryptoScreener } from "@hanzo/ui"

/** Default — TradingView's crypto screener, overview column, dark, 550px tall and as wide as its parent. */
export function Default() {
  return <CryptoScreener market="crypto" colorTheme="dark" />
}

/** Light and short — `colorTheme="light"` takes the screener's light palette and `height` sets the frame. */
export function LightAndShort() {
  return <CryptoScreener colorTheme="light" height={360} rounded="$3" />
}

/** Performance column — `defaultColumn="performance"` opens the table sorted on price change instead of the overview fields. */
export function PerformanceColumn() {
  return <CryptoScreener defaultColumn="performance" displayCurrency="EUR" />
}

/** Stacked — each screener is its own frame, so two column sets sit side by side as a column of boxes. */
export function Stacked() {
  return (
    <YStack gap="$4">
      <CryptoScreener defaultColumn="overview" height={320} />
      <CryptoScreener defaultColumn="moving_averages" height={320} />
    </YStack>
  )
}
