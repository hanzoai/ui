import { useState } from "react"
import { XStack, YStack } from "@hanzo/gui"
import { Button, MarketOverview } from "@hanzo/ui"

/** Default — the crypto preset, dark, 550px tall and as wide as its parent. */
export function Default() {
  return <MarketOverview />
}

/** Several presets — indices, futures, bonds and forex open as separate tabs in one table. */
export function SeveralPresets() {
  return <MarketOverview tabs={["indices", "futures", "bonds", "forex"]} height={420} />
}

/** Custom tab — a preset and a spelled-out watchlist sit side by side as tabs. */
export function CustomTab() {
  return (
    <MarketOverview
      tabs={[
        "crypto",
        {
          title: "Watchlist",
          symbols: [
            { s: "NASDAQ:AAPL", d: "Apple" },
            { s: "NASDAQ:MSFT", d: "Microsoft" },
          ],
        },
      ]}
      colorTheme="light"
      height={420}
    />
  )
}

/** Controlled — the open tab comes from state; a change opens the table afresh. */
export function Controlled() {
  const presets = ["crypto", "indices", "forex"] as const
  const [tab, setTab] = useState<(typeof presets)[number]>("crypto")
  return (
    <YStack gap="$3">
      <XStack gap="$2">
        {presets.map((p) => (
          <Button
            key={p}
            size="sm"
            variant={p === tab ? "primary" : "outline"}
            onPress={() => setTab(p)}
          >
            {p}
          </Button>
        ))}
      </XStack>
      <MarketOverview tabs={[tab]} height={380} />
    </YStack>
  )
}
