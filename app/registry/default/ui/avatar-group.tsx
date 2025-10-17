"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/default/ui/avatar"

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  items: Array<{
    src?: string
    alt?: string
    fallback: string
  }>
  max?: number
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, items, max = 5, ...props }, ref) => {
    const displayItems = items.slice(0, max)
    const remaining = items.length - max

    return (
      <div ref={ref} className={cn("flex -space-x-4", className)} {...props}>
        {displayItems.map((item, index) => (
          <Avatar key={index} className="border-2 border-background">
            <AvatarImage src={item.src} alt={item.alt} />
            <AvatarFallback>{item.fallback}</AvatarFallback>
          </Avatar>
        ))}
        {remaining > 0 && (
          <Avatar className="border-2 border-background">
            <AvatarFallback>+{remaining}</AvatarFallback>
          </Avatar>
        )}
      </div>
    )
  }
)
AvatarGroup.displayName = "AvatarGroup"

export { AvatarGroup }
