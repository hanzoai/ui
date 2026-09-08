import { useState } from "react"
import { YStack } from "@hanzo/gui"
import { NavigationBar } from "@hanzo/ui"

/** Simple — a logo on the left, links on the right. */
export function Simple() {
  return (
    <NavigationBar
      logo="Acme"
      items={[
        { label: "Docs", href: "/docs" },
        { label: "Pricing", href: "/pricing" },
        { label: "Blog", href: "/blog" },
      ]}
    />
  )
}

/** Centered logo — one set of links on each side of a logo in the middle. */
export function CenteredLogo() {
  return (
    <NavigationBar
      variant="centered"
      logo="Acme"
      leftItems={[
        { label: "Shop", href: "/shop" },
        { label: "New", href: "/new" },
      ]}
      rightItems={[
        { label: "Cart", href: "/cart" },
        { label: "Account", href: "/account" },
      ]}
    />
  )
}

/** Breadcrumb — an ordered trail with the current page called out and not linked. */
export function Breadcrumb() {
  return (
    <NavigationBar
      variant="breadcrumb"
      items={[
        { label: "Home", href: "/" },
        { label: "Settings", href: "/settings" },
        { label: "Profile" },
      ]}
    />
  )
}

/** Model switcher — a dropdown trigger showing the current pick; choosing another fires onValueChange. */
export function ModelSwitcher() {
  const [model, setModel] = useState("gpt-4")
  return (
    <YStack gap="$2">
      <NavigationBar
        variant="switcher"
        value={model}
        onValueChange={setModel}
        options={[
          { id: "gpt-4", label: "GPT-4", description: "OpenAI" },
          { id: "claude", label: "Claude", description: "Anthropic" },
          { id: "zen", label: "Zen", description: "Hanzo" },
        ]}
      />
    </YStack>
  )
}
