import { XStack, YStack } from "@hanzo/gui"
import { Ticker } from "@hanzo/ui"

/** Default — a row of pills scrolling left, forever. */
export function Default() {
  return (
    <Ticker>
      <XStack gap="$4" px="$4">
        {["🚀 Breaking News", "Latest Updates", "Live Feed", "Real-time Ticker"].map((label) => (
          <YStack key={label} px="$3" py="$2" rounded="$2" bg="$hover">
            {label}
          </YStack>
        ))}
      </XStack>
    </Ticker>
  )
}

/** Direction — the same row run to the right instead of the left. */
export function Direction() {
  return (
    <Ticker direction="right">
      <XStack gap="$4" px="$4">
        {["Right to left is default", "This one runs the other way"].map((label) => (
          <YStack key={label} px="$3" py="$2" rounded="$2" bg="$hover">
            {label}
          </YStack>
        ))}
      </XStack>
    </Ticker>
  )
}

/** Speed — a faster loop, and pause-on-hover turned off so it never stops. */
export function SpeedAndHover() {
  return (
    <Ticker speed={15} pauseOnHover={false}>
      <XStack px="$3">Won't pause, and loops in 15s</XStack>
    </Ticker>
  )
}
