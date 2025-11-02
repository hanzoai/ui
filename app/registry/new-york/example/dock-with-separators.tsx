import {
  Calendar,
  Home,
  Image,
  Mail,
  Music,
  Search,
  Settings,
  User,
  Video,
} from "lucide-react"

import { Dock, DockItem } from "@/registry/default/ui/dock"

export default function DockWithSeparatorsDemo() {
  return (
    <div className="relative flex h-[500px] w-full items-end justify-center rounded-lg border bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Dock className="mb-8">
        <DockItem
          tooltip="Finder"
          onClick={() => console.log("Finder clicked")}
        >
          <Home className="h-6 w-6" />
        </DockItem>
        <DockItem
          tooltip="Safari"
          onClick={() => console.log("Safari clicked")}
        >
          <Search className="h-6 w-6" />
        </DockItem>

        <div className="mx-1 h-10 w-px self-center bg-white/20" />

        <DockItem tooltip="Music" onClick={() => console.log("Music clicked")}>
          <Music className="h-6 w-6" />
        </DockItem>
        <DockItem
          tooltip="Videos"
          onClick={() => console.log("Videos clicked")}
        >
          <Video className="h-6 w-6" />
        </DockItem>
        <DockItem
          tooltip="Photos"
          onClick={() => console.log("Photos clicked")}
        >
          <Image className="h-6 w-6" />
        </DockItem>

        <div className="mx-1 h-10 w-px self-center bg-white/20" />

        <DockItem tooltip="Mail" onClick={() => console.log("Mail clicked")}>
          <Mail className="h-6 w-6" />
        </DockItem>
        <DockItem
          tooltip="Calendar"
          onClick={() => console.log("Calendar clicked")}
        >
          <Calendar className="h-6 w-6" />
        </DockItem>

        <div className="mx-1 h-10 w-px self-center bg-white/20" />

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
