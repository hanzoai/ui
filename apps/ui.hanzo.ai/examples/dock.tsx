import { YStack } from "@hanzo/gui"
import { Dock, DockItem, DockSeparator } from "@hanzo/ui"
import {
  Calendar,
  Home,
  Mail,
  Search,
  Settings,
  User,
} from "@hanzogui/lucide-icons-2"

/** Default — a bottom dock of icon buttons that grow as the pointer nears them. */
export function Default() {
  return (
    <YStack width="100%" height={140} items="center" justify="flex-end" pb="$4">
      <Dock>
        <DockItem tooltip="Home" onClick={() => console.log("Home clicked")}>
          <Home size={22} />
        </DockItem>
        <DockItem tooltip="Search" onClick={() => console.log("Search clicked")}>
          <Search size={22} />
        </DockItem>
        <DockItem tooltip="Mail" onClick={() => console.log("Mail clicked")}>
          <Mail size={22} />
        </DockItem>
        <DockItem tooltip="Calendar" onClick={() => console.log("Calendar clicked")}>
          <Calendar size={22} />
        </DockItem>
        <DockItem tooltip="Settings" onClick={() => console.log("Settings clicked")}>
          <Settings size={22} />
        </DockItem>
      </Dock>
    </YStack>
  )
}

/** Positions — the same dock stood along the left or the right edge instead of the bottom. */
export function Positions() {
  return (
    <YStack width="100%" height={200} justify="space-between" style={{ flexDirection: "row" }}>
      <Dock position="left">
        <DockItem tooltip="Home">
          <Home size={20} />
        </DockItem>
        <DockItem tooltip="Search">
          <Search size={20} />
        </DockItem>
      </Dock>
      <Dock position="right">
        <DockItem tooltip="Mail">
          <Mail size={20} />
        </DockItem>
        <DockItem tooltip="Settings">
          <Settings size={20} />
        </DockItem>
      </Dock>
    </YStack>
  )
}

/** Magnification — `magnification` and `distance` tune how much an item grows and how far the effect reaches; both at zero turns it off. */
export function Magnification() {
  return (
    <YStack width="100%" gap="$6" items="center">
      <Dock magnification={80} distance={160}>
        <DockItem tooltip="Home">
          <Home size={22} />
        </DockItem>
        <DockItem tooltip="Search">
          <Search size={22} />
        </DockItem>
        <DockItem tooltip="Settings">
          <Settings size={22} />
        </DockItem>
      </Dock>
      <Dock magnification={0} distance={0}>
        <DockItem tooltip="Home">
          <Home size={22} />
        </DockItem>
        <DockItem tooltip="Search">
          <Search size={22} />
        </DockItem>
        <DockItem tooltip="Settings">
          <Settings size={22} />
        </DockItem>
      </Dock>
    </YStack>
  )
}

/** With separators — `DockSeparator` splits the row into clusters, the way Finder sits apart from Mail and Calendar. */
export function WithSeparators() {
  return (
    <YStack width="100%" height={140} items="center" justify="flex-end" pb="$4">
      <Dock>
        <DockItem tooltip="Home">
          <Home size={22} />
        </DockItem>
        <DockItem tooltip="Search">
          <Search size={22} />
        </DockItem>
        <DockSeparator />
        <DockItem tooltip="Mail">
          <Mail size={22} />
        </DockItem>
        <DockItem tooltip="Calendar">
          <Calendar size={22} />
        </DockItem>
        <DockSeparator />
        <DockItem tooltip="Settings">
          <Settings size={22} />
        </DockItem>
        <DockItem tooltip="Profile">
          <User size={22} />
        </DockItem>
      </Dock>
    </YStack>
  )
}
