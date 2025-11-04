import { Home, Settings, FileText, Database } from "lucide-react"

import { AppSwitcherNavigationBar } from "@/registry/default/ui/app-switcher-navigation-bar"

export default function AppSwitcherNavigationBarDemo() {
  const apps = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: <Home className="h-4 w-4" />,
    },
    {
      id: "documents",
      name: "Documents",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: "database",
      name: "Database",
      icon: <Database className="h-4 w-4" />,
    },
    {
      id: "settings",
      name: "Settings",
      icon: <Settings className="h-4 w-4" />,
    },
  ]

  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <AppSwitcherNavigationBar apps={apps} currentApp="dashboard" />
    </div>
  )
}
