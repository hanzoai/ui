"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select"

interface AIModel {
  id: string
  name: string
  provider: string
  description?: string
}

interface AIModelSelectorNavigationBarProps
  extends React.HTMLAttributes<HTMLElement> {
  models: AIModel[]
  currentModel?: string
  onModelChange?: (modelId: string) => void
}

const AIModelSelectorNavigationBar = React.forwardRef<
  HTMLElement,
  AIModelSelectorNavigationBarProps
>(
  (
    { className, models, currentModel, onModelChange, children, ...props },
    ref
  ) => {
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
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Model:</span>
            <Select value={currentModel} onValueChange={onModelChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {model.provider}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">{children}</div>
      </nav>
    )
  }
)

AIModelSelectorNavigationBar.displayName = "AIModelSelectorNavigationBar"

export { AIModelSelectorNavigationBar, type AIModel as AIModelForNav }
