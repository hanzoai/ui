"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"

export interface Message {
  id: string
  type?: "info" | "success" | "warning" | "error"
  title: string
  description?: string
}

export interface MessageDockProps extends React.HTMLAttributes<HTMLDivElement> {
  messages: Message[]
  onClose?: (id: string) => void
  position?: "top" | "bottom" | "top-right" | "bottom-right"
}

const MessageDock = React.forwardRef<HTMLDivElement, MessageDockProps>(
  (
    { className, messages, onClose, position = "bottom-right", ...props },
    ref
  ) => {
    const positionClasses = {
      top: "top-4 left-1/2 -translate-x-1/2",
      bottom: "bottom-4 left-1/2 -translate-x-1/2",
      "top-right": "top-4 right-4",
      "bottom-right": "bottom-4 right-4",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "fixed z-50 flex flex-col gap-2",
          positionClasses[position],
          className
        )}
        {...props}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "min-w-[300px] rounded-lg border p-4 shadow-lg",
              message.type === "success" &&
                "border-green-500 bg-green-50 dark:bg-green-950",
              message.type === "warning" &&
                "border-yellow-500 bg-yellow-50 dark:bg-yellow-950",
              message.type === "error" &&
                "border-red-500 bg-red-50 dark:bg-red-950",
              message.type === "info" &&
                "border-blue-500 bg-blue-50 dark:bg-blue-950",
              !message.type && "bg-background"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-medium">{message.title}</h4>
                {message.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {message.description}
                  </p>
                )}
              </div>
              {onClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onClose(message.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }
)
MessageDock.displayName = "MessageDock"

export { MessageDock }
