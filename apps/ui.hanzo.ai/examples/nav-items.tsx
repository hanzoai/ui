import { useState } from "react"
import { Text, YStack } from "@hanzo/gui"
import {
  Button,
  NavItems,
  Popover,
  PopoverContent,
  PopoverTrigger,
  type NavItemsProps,
} from "@hanzo/ui"
import { ArrowUpRight, Menu } from "@hanzogui/lucide-icons-2"

/** Default — each `LinkDef` renders as a link inside a `nav` landmark; an `https:` href opens in a new tab with `rel` set, and nothing is current until you say which path you are on. */
export function Default() {
  return (
    <NavItems
      items={[
        { title: "Docs", href: "/docs" },
        { title: "Components", href: "/ui" },
        { title: "GitHub", href: "https://github.com/hanzoai/ui" },
      ]}
    />
  )
}

/** Current — `currentAs` is the path you are on; the item whose href matches carries `aria-current="page"`, and `itemClx` as a function lets the same comparison pick its look. */
export function Current() {
  const path = "/ui"
  return (
    <NavItems
      currentAs={path}
      itemClx={(def) => (def.href === path ? "font-semibold" : "opacity-70")}
      items={[
        { title: "Docs", href: "/docs" },
        { title: "Components", href: "/ui" },
        { title: "Changelog", href: "/changelog" },
      ]}
    />
  )
}

/** Element — `as` names the element holding the list: `nav` is a landmark a screen reader can jump to, `div` is right for a footer row that is not one, `ul` when the host already styles lists. */
export function Element() {
  const legal: NavItemsProps["items"] = [
    { title: "Privacy", href: "/privacy", variant: "linkMuted", size: "sm" },
    { title: "Terms", href: "/terms", variant: "linkMuted", size: "sm" },
    {
      title: "Status",
      href: "https://status.hanzo.ai",
      variant: "linkMuted",
      size: "sm",
    },
  ]
  return (
    <YStack gap="$4">
      <YStack gap="$1">
        <Text fontSize={12} color="$color10">
          nav
        </Text>
        <NavItems as="nav" items={legal} />
      </YStack>
      <YStack gap="$1">
        <Text fontSize={12} color="$color10">
          div
        </Text>
        <NavItems as="div" items={legal} />
      </YStack>
      <YStack gap="$1">
        <Text fontSize={12} color="$color10">
          ul
        </Text>
        <NavItems as="ul" items={legal} />
      </YStack>
    </YStack>
  )
}

/** Looks — each `LinkDef` carries its own `variant`, `size`, `icon` and `iconAfter`, so a call to action sits in the same list as the plain links beside it. */
export function Looks() {
  return (
    <NavItems
      className="gap-2"
      items={[
        { title: "Docs", href: "/docs" },
        { title: "Pricing", href: "/pricing" },
        {
          title: "Status",
          href: "https://status.hanzo.ai",
          variant: "linkMuted",
          icon: <ArrowUpRight size={14} />,
          iconAfter: true,
        },
        { title: "Sign in", href: "/login", variant: "outline", size: "sm" },
        {
          title: "Get started",
          href: "/signup",
          variant: "primary",
          size: "sm",
        },
      ]}
    />
  )
}

/** In a menu — `onNavigate` fires with the click, here closing the popover the list sits in; `className` turns the row into a column. */
export function InMenu() {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Open menu">
          <Menu size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <NavItems
          className="grid-flow-row gap-1"
          items={[
            { title: "Overview", href: "/" },
            { title: "Components", href: "/ui" },
            { title: "Docs", href: "/docs" },
            { title: "Source", href: "https://github.com/hanzoai/ui" },
          ]}
          onNavigate={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )
}
