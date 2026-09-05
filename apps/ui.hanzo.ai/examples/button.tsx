import { XStack } from "@hanzo/gui"
import { Button } from "@hanzo/ui"

/** Variants — every visual variant, from the filled default to the bare link. */
export function Variants() {
  return (
    <XStack flexWrap="wrap" gap="$3" items="center">
      <Button>Default</Button>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </XStack>
  )
}

/** Sizes — three text sizes and a square icon size for each of them. */
export function Sizes() {
  return (
    <XStack flexWrap="wrap" gap="$3" items="center">
      <Button size="sm">Small</Button>
      <Button>Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon-sm" aria-label="Small icon">
        +
      </Button>
      <Button size="icon" aria-label="Icon">
        +
      </Button>
      <Button size="icon-lg" aria-label="Large icon">
        +
      </Button>
    </XStack>
  )
}

/** States — a button that is loading shows a spinner and takes no clicks; a disabled one takes none and says so. */
export function States() {
  return (
    <XStack flexWrap="wrap" gap="$3" items="center">
      <Button isLoading>Saving</Button>
      <Button disabled>Disabled</Button>
      <Button variant="outline" disabled>
        Disabled outline
      </Button>
    </XStack>
  )
}

/** As a link — `asChild` styles the element you pass instead of rendering its own button. */
export function AsChild() {
  return (
    <Button asChild variant="outline">
      <a href="https://github.com/hanzoai/ui">Source on GitHub</a>
    </Button>
  )
}
