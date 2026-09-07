import { useState } from "react"
import { XStack, YStack } from "@hanzo/gui"
import { Button, ForexMarket } from "@hanzo/ui"

/** Default — the six major forex pairs, dark, 550px tall and as wide as its parent. */
export function Default() {
  return <ForexMarket />
}

/** Alongside other groups — indices and bonds open as additional tabs beside forex. */
export function AlongsideOtherGroups() {
  return <ForexMarket tabs={["forex", "indices", "bonds"]} height={420} />
}

/** Light theme — the table's own palette, independent of the surrounding page theme. */
export function LightTheme() {
  return <ForexMarket colorTheme="light" height={420} />
}

/** Controlled — the open group comes from state; a change opens the table afresh. */
export function Controlled() {
  const groups = ["forex", "crypto", "indices"] as const
  const [group, setGroup] = useState<(typeof groups)[number]>("forex")
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
      <ForexMarket tabs={[group]} height={380} />
    </YStack>
  )
}
