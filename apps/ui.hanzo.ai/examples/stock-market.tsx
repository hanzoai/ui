import { useState } from "react"
import { XStack, YStack } from "@hanzo/gui"
import { Button, StockMarket } from "@hanzo/ui"

/** Default — the six major indices, dark, 550px tall and as wide as its parent. */
export function Default() {
  return <StockMarket />
}

/** Alongside other groups — futures and bonds open as additional tabs beside indices. */
export function AlongsideOtherGroups() {
  return <StockMarket tabs={["indices", "futures", "bonds"]} height={420} />
}

/** Light theme — the table's own palette, independent of the surrounding page theme. */
export function LightTheme() {
  return <StockMarket colorTheme="light" height={420} />
}

/** Controlled — the open group comes from state; a change opens the table afresh. */
export function Controlled() {
  const groups = ["indices", "futures", "forex"] as const
  const [group, setGroup] = useState<(typeof groups)[number]>("indices")
  return (
    <YStack gap="$3">
      <XStack gap="$2">
        {groups.map((g) => (
          <Button
            key={g}
            size="sm"
            variant={g === group ? "primary" : "outline"}
            onPress={() => setGroup(g)}
          >
            {g}
          </Button>
        ))}
      </XStack>
      <StockMarket tabs={[group]} height={380} />
    </YStack>
  )
}
