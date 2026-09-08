import { YStack, SizableText } from "@hanzo/gui"
import { Cursor } from "@hanzo/ui"

/** Default — a bare dot follows the pointer over the wrapped area. */
export function Default() {
  return (
    <Cursor>
      <YStack p="$8" items="center" justify="center" bg="$color2" rounded="$4">
        <SizableText>Move your mouse over this area</SizableText>
      </YStack>
    </Cursor>
  )
}

/** Labelled — cursorText draws a short label inside the dot. */
export function Labelled() {
  return (
    <Cursor cursorText="✨" cursorSize={28}>
      <YStack p="$8" items="center" justify="center" bg="$color2" rounded="$4">
        <SizableText>A label rides along with the dot</SizableText>
      </YStack>
    </Cursor>
  )
}

/** Small dot — a tighter cursorSize for a subtler effect. */
export function Small() {
  return (
    <Cursor cursorSize={10}>
      <YStack p="$8" items="center" justify="center" bg="$color2" rounded="$4">
        <SizableText>A smaller follower</SizableText>
      </YStack>
    </Cursor>
  )
}
