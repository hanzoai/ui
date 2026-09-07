import { Paragraph, YStack } from "@hanzo/gui"
import { Cursor } from "@hanzo/ui"

/** Default — move the mouse over the frame to see the dot follow it. */
export function Default() {
  return (
    <Cursor>
      <YStack
        minH={200}
        items="center"
        justify="center"
        rounded="$4"
        bg="$color2"
      >
        <Paragraph>Move your mouse over this area</Paragraph>
      </YStack>
    </Cursor>
  )
}

/** With a label — cursorText renders inside the dot, and cursorSize sets its diameter. */
export function WithLabel() {
  return (
    <Cursor cursorText="✨" cursorSize={32}>
      <YStack
        minH={200}
        items="center"
        justify="center"
        rounded="$4"
        bg="$color2"
      >
        <Paragraph>Hover for a labeled cursor</Paragraph>
      </YStack>
    </Cursor>
  )
}

/** Small dot — a tighter cursorSize for a subtler effect. */
export function SmallDot() {
  return (
    <Cursor cursorSize={12}>
      <YStack
        minH={200}
        items="center"
        justify="center"
        rounded="$4"
        bg="$color2"
      >
        <Paragraph>A smaller tracking dot</Paragraph>
      </YStack>
    </Cursor>
  )
}
