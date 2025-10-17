"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/new-york/ui/button"

export interface DialogStackItem {
  id: string
  title: string
  content: React.ReactNode
}

export interface DialogStackProps extends React.HTMLAttributes<HTMLDivElement> {
  dialogs: DialogStackItem[]
  onClose?: (id: string) => void
}

const DialogStack = React.forwardRef<HTMLDivElement, DialogStackProps>(
  ({ className, dialogs, onClose, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        {dialogs.map((dialog, index) => (
          <div
            key={dialog.id}
            className={cn(
              "absolute inset-0 rounded-lg border bg-background p-6 shadow-lg transition-transform"
            )}
            style={{
              transform: `translate(${index * 10}px, ${index * 10}px)`,
              zIndex: index,
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{dialog.title}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onClose?.(dialog.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div>{dialog.content}</div>
          </div>
        ))}
      </div>
    )
  }
)
DialogStack.displayName = "DialogStack"

export { DialogStack }
