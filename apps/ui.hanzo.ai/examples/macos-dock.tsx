import { YStack } from "@hanzo/gui"
import { MacosDock, MacosDockItem } from "@hanzo/ui"
import {
  Calendar,
  Home,
  Mail,
  Search,
  Settings,
  User,
} from "@hanzogui/lucide-icons-2"

/** Default — the glass macOS dock, items magnifying as the pointer nears them. */
export function Default() {
  return (
    <YStack width="100%" height={140} items="center" justify="flex-end" pb="$4">
      <MacosDock>
        <MacosDockItem tooltip="Finder" onClick={() => console.log("Finder")}>
          <Home size={22} />
        </MacosDockItem>
        <MacosDockItem tooltip="Safari" onClick={() => console.log("Safari")}>
          <Search size={22} />
        </MacosDockItem>
        <MacosDockItem tooltip="Mail" onClick={() => console.log("Mail")}>
          <Mail size={22} />
        </MacosDockItem>
        <MacosDockItem tooltip="Calendar" onClick={() => console.log("Calendar")}>
          <Calendar size={22} />
        </MacosDockItem>
      </MacosDock>
    </YStack>
  )
}

/** With app icons — any icon set rides the same glass shelf and magnification. */
export function AppIcons() {
  return (
    <YStack width="100%" height={140} items="center" justify="flex-end" pb="$4">
      <MacosDock>
        <MacosDockItem tooltip="Settings" onClick={() => console.log("Settings")}>
          <Settings size={22} />
        </MacosDockItem>
        <MacosDockItem tooltip="Profile" onClick={() => console.log("Profile")}>
          <User size={22} />
        </MacosDockItem>
        <MacosDockItem tooltip="Mail" onClick={() => console.log("Mail")}>
          <Mail size={22} />
        </MacosDockItem>
      </MacosDock>
    </YStack>
  )
}

/** Magnification — `magnification` and `distance` tune how much an item grows and how far the effect reaches. */
export function Magnification() {
  return (
    <YStack width="100%" items="center" justify="flex-end" pb="$4">
      <MacosDock magnification={80} distance={160}>
        <MacosDockItem tooltip="Finder">
          <Home size={22} />
        </MacosDockItem>
        <MacosDockItem tooltip="Safari">
          <Search size={22} />
        </MacosDockItem>
        <MacosDockItem tooltip="Settings">
          <Settings size={22} />
        </MacosDockItem>
      </MacosDock>
    </YStack>
  )
}
