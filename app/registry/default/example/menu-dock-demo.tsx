import { MenuDock } from "@/registry/default/ui/menu-dock"
import { Home, Search, Bell, Settings } from "lucide-react"

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
