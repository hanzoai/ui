import { Text, XStack, YStack } from '@hanzo/gui'
import { Kbd, KbdGroup } from '@hanzo/ui'

/** Single key — one `Kbd` for a lone shortcut like Escape. */
export function SingleKey() {
  return (
    <XStack gap="$2" items="center">
      <Kbd>Esc</Kbd>
      <Kbd>Enter</Kbd>
    </XStack>
  )
}

/** Chord — `KbdGroup` sets several keys together to read as one shortcut. */
export function Chord() {
  return (
    <XStack gap="$3" items="center">
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <Kbd>B</Kbd>
      </KbdGroup>
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>Shift</Kbd>
        <Kbd>P</Kbd>
      </KbdGroup>
    </XStack>
  )
}

/** In a sentence — a shortcut referenced inline with ordinary text. */
export function InText() {
  return (
    <YStack gap="$2">
      <XStack gap="$1" items="center">
        <Text>Press</Text>
        <Kbd>Ctrl</Kbd>
        <Text>+</Text>
        <Kbd>K</Kbd>
        <Text>to open the command palette.</Text>
      </XStack>
    </YStack>
  )
}
