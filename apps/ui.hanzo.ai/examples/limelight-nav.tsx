import { useState } from "react"
import { YStack } from "@hanzo/gui"
import { LimelightNav, type LimelightNavItem } from "@hanzo/ui"

const items: LimelightNavItem[] = [
  { id: "overview", label: "Overview" },
  { id: "docs", label: "Docs" },
  { id: "changelog", label: "Changelog" },
  { id: "support", label: "Support" },
]

/** Default — an uncontrolled floating pill; the glow slides to whichever item you click. */
export function Default() {
  return <LimelightNav items={items} defaultValue="docs" />
}

/** Controlled — the active item lives in your own state, so other UI can drive it too. */
export function Controlled() {
  const [value, setValue] = useState("overview")
  return (
    <YStack gap="$3">
      <LimelightNav items={items} value={value} onValueChange={setValue} />
    </YStack>
  )
}

/** Bar — the full-width page-navigation shape, a hairline instead of a floating pill. */
export function Bar() {
  return <LimelightNav items={items} defaultValue="overview" variant="bar" />
}

/** With links — an item carrying an `href` renders as a real anchor. */
export function Links() {
  const linked: LimelightNavItem[] = [
    { id: "home", label: "Home", href: "/" },
    { id: "docs", label: "Docs", href: "/docs" },
    { id: "blog", label: "Blog", href: "/blog" },
  ]
  return <LimelightNav items={linked} defaultValue="home" />
}
