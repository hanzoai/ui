import { useState } from "react"
import { Text, YStack } from "@hanzo/gui"
import { MinimalTiptap } from "@hanzo/ui"

/** Default — a prose field that opens at a 200px floor, tall enough for a paragraph before it ever scrolls. */
export function Default() {
  return (
    <YStack width={420}>
      <MinimalTiptap placeholder="Write the release notes…" />
    </YStack>
  )
}

/** Controlled — `value` and `onChange` take and hand back a plain string, the same shape a form's own state already speaks. */
export function Controlled() {
  const [body, setBody] = useState("")
  return (
    <YStack width={420} gap="$2">
      <MinimalTiptap value={body} onChange={setBody} placeholder="What changed, and why" />
      <Text fontSize="$2" color="$quiet">
        {body.length} characters
      </Text>
    </YStack>
  )
}

/** Floor — the 200px minimum is a default, not a pin: a shorter field for a one-line summary, a taller one for a full changelog entry. */
export function Floor() {
  return (
    <YStack width={420} gap="$3">
      <MinimalTiptap minH={80} placeholder="One-line summary" />
      <MinimalTiptap minH={320} placeholder="Full changelog entry" />
    </YStack>
  )
}

/** Disabled — a closed field takes no input and fades, same as any other text field. */
export function Disabled() {
  return (
    <YStack width={420}>
      <MinimalTiptap disabled defaultValue="Locked after the release shipped." />
    </YStack>
  )
}
