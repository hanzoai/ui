import { YStack } from "@hanzo/gui"
import { MenuDock } from "@hanzo/ui"

/** Default — a horizontal pill of icon buttons with the first one active. */
export function Default() {
  return (
    <YStack items="center" justify="center" minH={160}>
      <MenuDock
        items={[
          { icon: "🏠", label: "Home", active: true },
          { icon: "🔍", label: "Search" },
          { icon: "🔔", label: "Notifications" },
          { icon: "⚙️", label: "Settings" },
        ]}
      />
    </YStack>
  )
}

/** Vertical — the same dock as a column, for a side navigation rail. */
export function Vertical() {
  return (
    <YStack items="center" justify="center" minH={280}>
      <MenuDock
        orientation="vertical"
        items={[
          { icon: "🏠", label: "Home" },
          { icon: "🔍", label: "Search", active: true },
          { icon: "🔔", label: "Notifications" },
        ]}
      />
    </YStack>
  )
}

/** Clickable — each item runs its own handler when pressed. */
export function Clickable() {
  return (
    <YStack items="center" justify="center" minH={160}>
      <MenuDock
        items={[
          { icon: "🏠", label: "Home", onClick: () => console.log("home") },
          { icon: "🔍", label: "Search", onClick: () => console.log("search") },
        ]}
      />
    </YStack>
  )
}
