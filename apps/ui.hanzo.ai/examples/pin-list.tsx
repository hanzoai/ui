import { useState } from "react"
import { XStack, YStack, SizableText } from "@hanzo/gui"
import { PinList, type PinListItem } from "@hanzo/ui"

const projects: PinListItem[] = [
  { id: "quasar", label: "Quasar", description: "Consensus engine" },
  { id: "pulsar", label: "Pulsar", description: "Threshold signatures" },
  { id: "prism", label: "Prism", description: "State sync" },
  { id: "torus", label: "Torus", description: "FHE compiler" },
]

/** Default — click the pin to move a row to the top; click it again to send it back. */
export function Default() {
  return (
    <YStack width={320}>
      <PinList items={projects} defaultValue={["pulsar"]} />
    </YStack>
  )
}

/** Controlled — the pinned set lives in the caller's own state, shown alongside the list. */
export function Controlled() {
  const [pinned, setPinned] = useState<string[]>(["quasar"])
  return (
    <YStack width={320} gap="$3">
      <PinList items={projects} value={pinned} onValueChange={setPinned} />
      <XStack gap="$2" flexWrap="wrap">
        <SizableText size="$2" color="$quiet">
          Pinned: {pinned.length ? pinned.join(", ") : "none"}
        </SizableText>
      </XStack>
    </YStack>
  )
}

/** Capped — at most two rows may be pinned; unpinning one frees a slot for another. */
export function Capped() {
  return (
    <YStack width={320}>
      <PinList items={projects} defaultValue={["quasar", "pulsar"]} max={2} />
    </YStack>
  )
}

/** In place — pinnedFirst is false, so a pinned row is marked but never reordered. */
export function InPlace() {
  return (
    <YStack width={320}>
      <PinList items={projects} defaultValue={["torus"]} pinnedFirst={false} />
    </YStack>
  )
}
