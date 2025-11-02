import {
  Calendar,
  Home,
  Mail,
  Music,
  Search,
  Settings,
  User,
  Video,
} from "lucide-react"

import { Dock, DockItem } from "@/registry/default/ui/dock"

export default function DockDemo() {
  return (
    <div className="relative flex h-[500px] w-full items-end justify-center rounded-lg border bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Dock className="mb-8">
        <DockItem tooltip="Home" onClick={() => console.log("Home clicked")}>
          <Home className="h-6 w-6" />
        </DockItem>
        <DockItem
          tooltip="Search"
          onClick={() => console.log("Search clicked")}
        >
          <Search className="h-6 w-6" />
        </DockItem>
        <DockItem tooltip="Music" onClick={() => console.log("Music clicked")}>
          <Music className="h-6 w-6" />
        </DockItem>
        <DockItem tooltip="Video" onClick={() => console.log("Video clicked")}>
          <Video className="h-6 w-6" />
        </DockItem>
        <DockItem tooltip="Mail" onClick={() => console.log("Mail clicked")}>
          <Mail className="h-6 w-6" />
        </DockItem>
        <DockItem
          tooltip="Calendar"
          onClick={() => console.log("Calendar clicked")}
        >
          <Calendar className="h-6 w-6" />
        </DockItem>
        <DockItem
          tooltip="Settings"
          onClick={() => console.log("Settings clicked")}
        >
          <Settings className="h-6 w-6" />
        </DockItem>
        <DockItem
          tooltip="Profile"
          onClick={() => console.log("Profile clicked")}
        >
          <User className="h-6 w-6" />
        </DockItem>
      </Dock>
    </div>
  )
}
