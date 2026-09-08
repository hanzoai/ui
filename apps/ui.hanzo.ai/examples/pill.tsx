import { XStack } from "@hanzo/gui"
import { Pill } from "@hanzo/ui"

/** Variants — a filled default, a quieter secondary, an outline, and the three status colors. */
export function Variants() {
  return (
    <XStack flexWrap="wrap" gap="$3" items="center">
      <Pill>Default</Pill>
      <Pill variant="secondary">Secondary</Pill>
      <Pill variant="outline">Outline</Pill>
      <Pill variant="success">Success</Pill>
      <Pill variant="warning">Warning</Pill>
      <Pill variant="error">Error</Pill>
    </XStack>
  )
}

/** Removable — pass onRemove to add a close button; pressing it fires the callback. */
export function Removable() {
  return (
    <XStack flexWrap="wrap" gap="$3" items="center">
      <Pill variant="secondary" onRemove={() => {}}>
        JavaScript
      </Pill>
      <Pill variant="secondary" onRemove={() => {}}>
        TypeScript
      </Pill>
      <Pill variant="outline" onRemove={() => {}}>
        Rust
      </Pill>
    </XStack>
  )
}

/** Status list — pills reading as compact state labels beside plain text. */
export function StatusList() {
  return (
    <XStack flexWrap="wrap" gap="$4" items="center">
      <XStack gap="$2" items="center">
        <Pill variant="success">Online</Pill>
      </XStack>
      <XStack gap="$2" items="center">
        <Pill variant="warning">Degraded</Pill>
      </XStack>
      <XStack gap="$2" items="center">
        <Pill variant="error">Down</Pill>
      </XStack>
    </XStack>
  )
}
