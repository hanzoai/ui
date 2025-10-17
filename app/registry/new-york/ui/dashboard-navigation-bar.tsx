"use client"

import * as React from "react"
import { Bell, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/new-york/ui/avatar"
import { Button } from "@/registry/new-york/ui/button"

export interface DashboardNavigationBarProps
  extends React.HTMLAttributes<HTMLElement> {
  title?: string
  user?: { name: string; avatar?: string }
}

const DashboardNavigationBar = React.forwardRef<
  HTMLElement,
  DashboardNavigationBarProps
>(({ className, title, user, ...props }, ref) => {
  return (
    <nav ref={ref} className={cn("border-b", className)} {...props}>
      <div className="container flex h-16 items-center justify-between">
        <h1 className="text-xl font-semibold">{title}</h1>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          {user && (
            <Avatar>
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </nav>
  )
})
DashboardNavigationBar.displayName = "DashboardNavigationBar"

export { DashboardNavigationBar }
