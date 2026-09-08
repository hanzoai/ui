import { YStack } from "@hanzo/gui"
import { InteractiveGridPattern } from "@hanzo/ui"

/** Default — a 24x24 board of 40px cells, lighting up under the pointer. */
export function Default() {
  return (
    <YStack width="100%" overflow="hidden" borderWidth={1} borderColor="$borderColor">
      <InteractiveGridPattern squares={[24, 24]} width={40} height={40} />
    </YStack>
  )
}

/** Small cells — a denser board reads as a texture rather than a puzzle. */
export function SmallCells() {
  return (
    <YStack width="100%" overflow="hidden" borderWidth={1} borderColor="$borderColor">
      <InteractiveGridPattern squares={[40, 20]} width={16} height={16} idleColor="transparent" hoverColor="currentColor" />
    </YStack>
  )
}

/** Tinted — idle cells carry a faint fill, so the whole board reads before any hover. */
export function Tinted() {
  return (
    <YStack width="100%" overflow="hidden" borderWidth={1} borderColor="$borderColor">
      <InteractiveGridPattern
        squares={[16, 10]}
        width={32}
        height={32}
        idleColor="rgba(128, 128, 128, 0.08)"
        hoverColor="rgba(128, 128, 128, 0.4)"
        strokeColor="currentColor"
      />
    </YStack>
  )
}
