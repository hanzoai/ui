import { NewsTimeline } from "@hanzo/ui"
import { YStack } from "@hanzo/gui"

/** Default — all symbols, dark, 400px tall and as wide as its parent. */
export function Default() {
  return <NewsTimeline />
}

/** Market feed — headlines narrowed to one market, in the light theme. */
export function MarketFeed() {
  return <NewsTimeline feedMode="market" market="crypto" colorTheme="light" height={420} />
}

/** Symbol feed — headlines narrowed to one symbol. */
export function SymbolFeed() {
  return <NewsTimeline feedMode="symbol" symbol="NASDAQ:AAPL" height={420} />
}

/** Compact — a shorter, transparent feed for embedding beside other panels. */
export function Compact() {
  return (
    <YStack width={360}>
      <NewsTimeline isTransparent height={280} />
    </YStack>
  )
}
