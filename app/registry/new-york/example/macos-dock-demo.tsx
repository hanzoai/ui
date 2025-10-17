import { Calendar, Home, Mail, Search, Settings, User } from "lucide-react"

import { Dock, DockItem } from "@/registry/new-york/ui/macos-dock"

export default function MacOSDockDemo() {
  return (
    <div className="flex min-h-[300px] items-end justify-center pb-12">
      <Dock>
        <DockItem tooltip="Finder" onClick={() => console.log("Finder")}>
          <Home className="h-6 w-6 text-white" />
        </DockItem>
        <DockItem tooltip="Safari" onClick={() => console.log("Safari")}>
          <Search className="h-6 w-6 text-white" />
        </DockItem>
        <DockItem tooltip="Mail" onClick={() => console.log("Mail")}>
          <Mail className="h-6 w-6 text-white" />
        </DockItem>
        <DockItem tooltip="Calendar" onClick={() => console.log("Calendar")}>
          <Calendar className="h-6 w-6 text-white" />
        </DockItem>
        <DockItem tooltip="Settings" onClick={() => console.log("Settings")}>
          <Settings className="h-6 w-6 text-white" />
        </DockItem>
        <DockItem tooltip="Profile" onClick={() => console.log("Profile")}>
          <User className="h-6 w-6 text-white" />
        </DockItem>
      </Dock>
    </div>
  )
}
