import { Bell, Home, Search, Settings } from "lucide-react"

import { MenuDock } from "@/registry/new-york/ui/menu-dock"

export default function MenuDockDemo() {
  const menuItems = [
    {
      icon: <Home className="h-5 w-5" />,
      label: "Home",
      active: true,
    },
    {
      icon: <Search className="h-5 w-5" />,
      label: "Search",
    },
    {
      icon: <Bell className="h-5 w-5" />,
      label: "Notifications",
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
    },
  ]

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center">
      <MenuDock items={menuItems} />
    </div>
  )
}
