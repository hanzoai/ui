import { Calendar, Home, Mail, Search, Settings, User } from "lucide-react"

import { Dock, DockItem } from "@/registry/default/ui/dock"

export default function DockMagnificationDemo() {
  return (
    <div className="flex flex-col gap-8">
      <div className="relative flex h-[200px] w-full items-end justify-center rounded-lg border bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="mb-4 text-center">
          <p className="text-sm text-muted-foreground">
            High magnification (80px)
          </p>
          <Dock magnification={80} distance={160} className="mb-2">
            <DockItem tooltip="Home">
              <Home className="h-6 w-6" />
            </DockItem>
            <DockItem tooltip="Search">
              <Search className="h-6 w-6" />
            </DockItem>
            <DockItem tooltip="Settings">
              <Settings className="h-6 w-6" />
            </DockItem>
            <DockItem tooltip="Profile">
              <User className="h-6 w-6" />
            </DockItem>
          </Dock>
        </div>
      </div>

      <div className="relative flex h-[200px] w-full items-end justify-center rounded-lg border bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="mb-4 text-center">
          <p className="text-sm text-muted-foreground">
            Low magnification (40px)
          </p>
          <Dock magnification={40} distance={100} className="mb-2">
            <DockItem tooltip="Home">
              <Home className="h-6 w-6" />
            </DockItem>
            <DockItem tooltip="Search">
              <Search className="h-6 w-6" />
            </DockItem>
            <DockItem tooltip="Settings">
              <Settings className="h-6 w-6" />
            </DockItem>
            <DockItem tooltip="Profile">
              <User className="h-6 w-6" />
            </DockItem>
          </Dock>
        </div>
      </div>

      <div className="relative flex h-[200px] w-full items-end justify-center rounded-lg border bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="mb-4 text-center">
          <p className="text-sm text-muted-foreground">No magnification</p>
          <Dock magnification={0} distance={0} className="mb-2">
            <DockItem tooltip="Home">
              <Home className="h-6 w-6" />
            </DockItem>
            <DockItem tooltip="Search">
              <Search className="h-6 w-6" />
            </DockItem>
            <DockItem tooltip="Settings">
              <Settings className="h-6 w-6" />
            </DockItem>
            <DockItem tooltip="Profile">
              <User className="h-6 w-6" />
            </DockItem>
          </Dock>
        </div>
      </div>
    </div>
  )
}
