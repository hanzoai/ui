import { XStack } from "@hanzo/gui"
import { LinkElement, MDXLink } from "@hanzo/ui"

/** Default — a link described by a definition: where it goes and what it says. */
export function Default() {
  return (
    <XStack flexWrap="wrap" gap="$3" items="center">
      <LinkElement def={{ href: "/ui/button", title: "Buttons" }} />
      <LinkElement
        def={{
          href: "https://github.com/hanzoai/ui",
          title: "Source",
          external: true,
          newTab: true,
        }}
      />
    </XStack>
  )
}

/** As a button — the definition or the props pick a variant and size. */
export function AsButton() {
  return (
    <XStack flexWrap="wrap" gap="$3" items="center">
      <LinkElement def={{ href: "/ui", title: "Browse", variant: "primary" }} />
      <LinkElement
        def={{ href: "/ui", title: "Browse" }}
        variant="outline"
        size="sm"
      />
      <LinkElement
        def={{ href: "/ui", title: "Disabled", disabled: true }}
        variant="secondary"
      />
    </XStack>
  )
}

/** Current page — `aria-current` marks the link to where the reader already is. */
export function CurrentPage() {
  return (
    <XStack gap="$3" items="center">
      <LinkElement
        def={{ href: "/ui/link", title: "Link" }}
        aria-current="page"
        variant="ghost"
      />
      <LinkElement
        def={{ href: "/ui/badge", title: "Badge" }}
        variant="ghost"
      />
    </XStack>
  )
}

/** In prose — the anchor MDX renders, an inline link with the running text's size. */
export function InProse() {
  return <MDXLink href="/ui/prose">the prose module</MDXLink>
}
