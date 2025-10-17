"use client"

import * as React from "react"
import { MessageSquare, Phone, Video } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/new-york/ui/button"

export interface CommunicationNavigationBarProps
  extends React.HTMLAttributes<HTMLElement> {
  contactName?: string
}

const CommunicationNavigationBar = React.forwardRef<
  HTMLElement,
  CommunicationNavigationBarProps
>(({ className, contactName, ...props }, ref) => {
  return (
    <nav ref={ref} className={cn("border-b", className)} {...props}>
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{contactName}</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  )
})
CommunicationNavigationBar.displayName = "CommunicationNavigationBar"

export { CommunicationNavigationBar }
