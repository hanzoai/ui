import { Paragraph, YStack } from "@hanzo/gui"
import { MotionHighlight } from "@hanzo/ui"

/** Default — hover over the heading and the paragraph to see the glow follow your cursor. */
export function Default() {
  return (
    <YStack gap="$4" maxW={480}>
      <MotionHighlight>
        <Paragraph size="$8" fontWeight="700">
          Interactive Highlight Effect
        </Paragraph>
      </MotionHighlight>
      <MotionHighlight>
        <Paragraph size="$5">
          Hover over this text to see the smooth highlight animation following
          your cursor.
        </Paragraph>
      </MotionHighlight>
    </YStack>
  )
}

/** Custom size — a larger, softer glow spans more of the panel per move. */
export function LargeGlow() {
  return (
    <MotionHighlight size={220}>
      <YStack p="$6" borderWidth={1} borderColor="$borderColor" rounded="$4">
        <Paragraph>A wider glow covers more ground per pointer move.</Paragraph>
      </YStack>
    </MotionHighlight>
  )
}

/** Custom color — the glow tints toward whatever color the caller passes. */
export function CustomColor() {
  return (
    <MotionHighlight color="rgba(16,185,129,0.18)">
      <YStack p="$6" borderWidth={1} borderColor="$borderColor" rounded="$4">
        <Paragraph>A green-tinted glow instead of the default.</Paragraph>
      </YStack>
    </MotionHighlight>
  )
}
