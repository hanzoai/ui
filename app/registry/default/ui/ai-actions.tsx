"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import { Card } from "@/registry/default/ui/card"

interface AIAction {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  onClick?: () => void
}

interface AIActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  actions: AIAction[]
}

const AIActions = React.forwardRef<HTMLDivElement, AIActionsProps>(
  ({ className, actions, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("grid gap-2 sm:grid-cols-2 lg:grid-cols-3", className)}
        {...props}
      >
        {actions.map((action) => (
          <Card
            key={action.id}
            className="p-4 cursor-pointer hover:bg-accent transition-colors"
            onClick={action.onClick}
          >
            <div className="flex items-start space-x-3">
              {action.icon && (
                <div className="flex-shrink-0 text-muted-foreground">
                  {action.icon}
                </div>
              )}
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {action.label}
                </p>
                {action.description && (
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }
)

AIActions.displayName = "AIActions"

export { AIActions, type AIAction }
