"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"

interface AnnouncementProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  dismissible?: boolean
  onDismiss?: () => void
}

const Announcement = React.forwardRef<HTMLDivElement, AnnouncementProps>(
  ({ className, children, dismissible = true, onDismiss, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true)

    const handleDismiss = () => {
      setIsVisible(false)
      onDismiss?.()
    }

    if (!isVisible) return null

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-center gap-4 rounded-lg border bg-background px-4 py-3 text-sm",
          className
        )}
        {...props}
      >
        <div className="flex-1">{children}</div>
        {dismissible && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        )}
      </div>
    )
  }
)

Announcement.displayName = "Announcement"

export { Announcement }
