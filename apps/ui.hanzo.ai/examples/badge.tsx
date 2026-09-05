import { XStack } from "@hanzo/gui"
import { Badge } from "@hanzo/ui"

/** Variants — a filled default, a quieter secondary, a destructive, and an outline. */
export function Variants() {
  return (
    <XStack flexWrap="wrap" gap="$3" items="center">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Ghost</Badge>
      <Badge variant="link">Link</Badge>
    </XStack>
  )
}

/** As a link — `asChild` puts the badge's styling on the anchor you pass. */
export function AsChild() {
  return (
    <Badge asChild variant="outline">
      <a href="https://www.npmjs.com/package/@hanzo/ui">@hanzo/ui on npm</a>
    </Badge>
  )
}
