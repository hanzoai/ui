import { useState } from "react"
import { Paragraph, XStack, YStack } from "@hanzo/gui"
import { AnimatedCursor, Button, Input } from "@hanzo/ui"

/** Default — one cursor for the whole page: a dot with an eight-point trail that grows over a button, turns into a bar over a text field and squares over anything marked `data-cursor="grab"`; the first button puts the native cursor back. */
export function Default() {
  const [on, setOn] = useState(false)
  return (
    <YStack gap="$3" items="flex-start">
      <AnimatedCursor isVisible={on} hideOnTouch={false} hoverScale={2} />
      <Button variant={on ? "primary" : "outline"} onPress={() => setOn(!on)}>
        {on ? "Native cursor" : "Animated cursor"}
      </Button>
      <XStack gap="$3" items="center" flexWrap="wrap">
        <Button variant="outline">A button</Button>
        <Input type="text" placeholder="A text field" />
        <Paragraph data-cursor="grab" color="$quiet">
          Drag me
        </Paragraph>
      </XStack>
    </YStack>
  )
}

/** Blend mode — `difference` inverts whatever the dot crosses; a larger dot, no trail, and a slower settle. */
export function BlendMode() {
  const [on, setOn] = useState(false)
  return (
    <YStack gap="$3" items="flex-start">
      <AnimatedCursor
        isVisible={on}
        hideOnTouch={false}
        blendMode="difference"
        color="#ffffff"
        showTrail={false}
        size={32}
        animationDuration={400}
      />
      <Button variant={on ? "primary" : "outline"} onPress={() => setOn(!on)}>
        {on ? "Native cursor" : "Animated cursor"}
      </Button>
      <YStack p="$5" rounded="$4" bg="$ink">
        <Paragraph color="$sunken">Move over this inverted panel</Paragraph>
      </YStack>
    </YStack>
  )
}
