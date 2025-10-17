"use client"

import * as React from "react"
import { Users } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/new-york/ui/avatar"

export interface CollaborationNavigationBarProps
  extends React.HTMLAttributes<HTMLElement> {
  title?: string
  collaborators?: Array<{ name: string; avatar?: string }>
}

const CollaborationNavigationBar = React.forwardRef<
  HTMLElement,
  CollaborationNavigationBarProps
>(({ className, title, collaborators = [], ...props }, ref) => {
  return (
    <nav ref={ref} className={cn("border-b", className)} {...props}>
      <div className="container flex h-16 items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-muted-foreground" />
          <div className="flex -space-x-2">
            {collaborators.slice(0, 3).map((user, i) => (
              <Avatar key={i} className="border-2 border-background">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
            ))}
            {collaborators.length > 3 && (
              <Avatar className="border-2 border-background">
                <AvatarFallback>+{collaborators.length - 3}</AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
})
CollaborationNavigationBar.displayName = "CollaborationNavigationBar"

export { CollaborationNavigationBar }
