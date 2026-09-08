import { YStack } from "@hanzo/gui"
import { StockScreener } from "@hanzo/ui"

/** Default — TradingView's US equity screener, overview column, dark, 500px tall and as wide as its parent. */
export function Default() {
  return <StockScreener market="america" colorTheme="dark" />
}

/** Light and short — `colorTheme="light"` takes the screener's light palette and `height` sets the frame. */
export function LightAndShort() {
  return <StockScreener colorTheme="light" height={360} rounded="$3" />
}

/** Top gainers — `defaultScreen="top_gainers"` opens the table pre-filtered instead of the general screen. */
export function TopGainers() {
  return <StockScreener defaultScreen="top_gainers" defaultColumn="performance" />
}

/** Stacked — each screener is its own frame, so two markets sit side by side as a column of boxes. */
export function Stacked() {
  return (
    <YStack gap="$4">
      <StockScreener market="america" height={320} />
      <StockScreener market="india" height={320} />
    </YStack>
  )
}
