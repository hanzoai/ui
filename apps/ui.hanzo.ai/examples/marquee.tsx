import { XStack, YStack } from "@hanzo/gui"
import { Marquee } from "@hanzo/ui"

/** Default — a horizontal ticker, looping a short row of pills. */
export function Default() {
  return (
    <Marquee>
      <XStack gap="$4" px="$4">
        {["Fast", "Accessible", "Themeable", "Composable"].map((label) => (
          <YStack key={label} px="$3" py="$2" rounded="$2" bg="$hover">
            {label}
          </YStack>
        ))}
      </XStack>
    </Marquee>
  )
}

/** Vertical — the same ticker running top to bottom inside a fixed frame. */
export function Vertical() {
  return (
    <YStack height={160}>
      <Marquee vertical gap={12}>
        <YStack gap="$2" py="$2">
          {["One", "Two", "Three"].map((label) => (
            <YStack key={label} px="$3" py="$2" rounded="$2" bg="$hover">
              {label}
            </YStack>
          ))}
        </YStack>
      </Marquee>
    </YStack>
  )
}

/** Reverse and pause on hover — runs backwards, and stops while a pointer sits on it. */
export function ReversePauseOnHover() {
  return (
    <Marquee reverse pauseOnHover repeat={4}>
      <XStack px="$3">Hover to pause</XStack>
    </Marquee>
  )
}
