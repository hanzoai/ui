import { useState } from "react"
import { XStack } from "@hanzo/gui"
import { Toggle } from "@hanzo/ui"

/** Default — a plain toggle button, off until it is pressed. */
export function Default() {
  return <Toggle aria-label="Toggle bold">Bold</Toggle>
}

/** Outline — the same button with its own edge instead of a filled well. */
export function Outline() {
  return (
    <Toggle variant="outline" aria-label="Toggle italic">
      Italic
    </Toggle>
  )
}

/** Sizes — small, default and large, on the same ladder a Button uses. */
export function Sizes() {
  return (
    <XStack gap="$3" items="center">
      <Toggle size="sm" aria-label="Toggle italic">
        A
      </Toggle>
      <Toggle size="default" aria-label="Toggle italic">
        A
      </Toggle>
      <Toggle size="lg" aria-label="Toggle italic">
        A
      </Toggle>
    </XStack>
  )
}

/** Controlled — the caller owns the pressed state and reads it back out. */
export function Controlled() {
  const [pressed, setPressed] = useState(false)
  return (
    <XStack gap="$3" items="center">
      <Toggle pressed={pressed} onPressedChange={setPressed} aria-label="Toggle underline">
        Underline
      </Toggle>
      <span>{pressed ? "on" : "off"}</span>
    </XStack>
  )
}
