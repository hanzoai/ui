import { XStack } from "@hanzo/gui"
import { AnimatedTooltip, Button } from "@hanzo/ui"

/** Default — hover or focus the button to fade the label into view above it. */
export function Default() {
  return (
    <XStack items="center" justify="center" p="$8">
      <AnimatedTooltip content="This is a helpful tooltip">
        <Button>Hover me</Button>
      </AnimatedTooltip>
    </XStack>
  )
}

/** Longer content — a full sentence stays on one line and centres over its trigger. */
export function LongContent() {
  return (
    <XStack items="center" justify="center" p="$8">
      <AnimatedTooltip content="Tooltips can contain longer descriptions and helpful information">
        <Button variant="outline">More info</Button>
      </AnimatedTooltip>
    </XStack>
  )
}

/** Delayed — the entrance animation holds for 300ms before it starts. */
export function Delayed() {
  return (
    <XStack items="center" justify="center" p="$8">
      <AnimatedTooltip content="Arrives a little later" delay={300}>
        <Button variant="outline">Wait for it</Button>
      </AnimatedTooltip>
    </XStack>
  )
}

/** Row of triggers — several tooltips side by side, each independent. */
export function Row() {
  return (
    <XStack items="center" justify="center" gap="$8" p="$8">
      <AnimatedTooltip content="First">
        <Button size="sm">One</Button>
      </AnimatedTooltip>
      <AnimatedTooltip content="Second">
        <Button size="sm">Two</Button>
      </AnimatedTooltip>
      <AnimatedTooltip content="Third">
        <Button size="sm">Three</Button>
      </AnimatedTooltip>
    </XStack>
  )
}
