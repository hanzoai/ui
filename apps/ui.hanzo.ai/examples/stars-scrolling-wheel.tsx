import { useState } from "react"
import { Text, XStack, YStack } from "@hanzo/gui"
import { StarsScrollingWheel } from "@hanzo/ui"

/** Default — an uncontrolled wheel starting at 0; scroll, drag or click a row to rate. */
export function Default() {
  return <StarsScrollingWheel defaultValue={0} max={5} />
}

/** Controlled — the caller owns the value and echoes it back after every change. */
export function Controlled() {
  const [value, setValue] = useState(3)
  return (
    <YStack gap="$3" items="center">
      <StarsScrollingWheel value={value} max={5} onValueChange={setValue} />
      <Text>{value} of 5 stars</Text>
    </YStack>
  )
}

/** Half stars — step 0.5 adds a half-star row between each whole rating. */
export function HalfStars() {
  return <StarsScrollingWheel defaultValue={2.5} max={5} step={0.5} />
}

/** Horizontal, sizes, and disabled — the wheel scrolls sideways, at three row scales. */
export function HorizontalAndSizes() {
  return (
    <XStack gap="$6" items="center" flexWrap="wrap">
      <StarsScrollingWheel orientation="horizontal" defaultValue={4} max={5} size="lg" />
      <StarsScrollingWheel defaultValue={2} max={5} size="sm" />
      <StarsScrollingWheel defaultValue={3} max={5} disabled />
    </XStack>
  )
}
