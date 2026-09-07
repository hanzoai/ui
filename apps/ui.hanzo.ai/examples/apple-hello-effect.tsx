import { YStack } from "@hanzo/gui"
import { AppleHelloEffect } from "@hanzo/ui"

/** Default — the word "Hello" revealing itself one letter at a time. */
export function Default() {
  return (
    <YStack items="center" justify="center" minH={200}>
      <AppleHelloEffect />
    </YStack>
  )
}

/** Custom text — any string works, split the same way. */
export function CustomText() {
  return (
    <YStack items="center" justify="center" minH={200}>
      <AppleHelloEffect text="Hanzo" />
    </YStack>
  )
}

/** Faster — a shorter `duration` makes each letter's rise snappier. */
export function Faster() {
  return (
    <YStack items="center" justify="center" minH={200}>
      <AppleHelloEffect text="Fast" duration={0.6} />
    </YStack>
  )
}
