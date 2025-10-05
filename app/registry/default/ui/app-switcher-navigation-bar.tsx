"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/registry/default/ui/dropdown-menu"

interface App {
  id: string
  name: string
  icon?: React.ReactNode
  href?: string
}

interface AppSwitcherNavigationBarProps
  extends React.HTMLAttributes<HTMLElement> {
  apps: App[]
  currentApp?: string
  onAppSwitch?: (appId: string) => void
}

const AppSwitcherNavigationBar = React.forwardRef<
  HTMLElement,
  AppSwitcherNavigationBarProps
>(({ className, apps, currentApp, onAppSwitch, children, ...props }, ref) => {
  const current = apps.find((app) => app.id === currentApp) || apps[0]

  return (
    <nav
      ref={ref}
      className={cn(
        "flex items-center justify-between border-b px-6 py-3",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              {current?.icon}
              <span>{current?.name}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {apps.map((app) => (
              <DropdownMenuItem
                key={app.id}
                onClick={() => {
                  if (app.href) {
                    window.location.href = app.href
                  } else {
                    onAppSwitch?.(app.id)
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  {app.icon}
                  <span>{app.name}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2">{children}</div>
      </div>
    </nav>
  )
})

AppSwitcherNavigationBar.displayName = "AppSwitcherNavigationBar"

export { AppSwitcherNavigationBar, type App }
