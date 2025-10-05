"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
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
  description?: string
  provider?: string
}

interface AIModelsProps extends React.HTMLAttributes<HTMLDivElement> {
  models: AIModel[]
  selectedModel?: string
  onModelSelect?: (modelId: string) => void
}

const AIModels = React.forwardRef<HTMLDivElement, AIModelsProps>(
  ({ className, models, selectedModel, onModelSelect, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <Select value={selectedModel} onValueChange={onModelSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{model.name}</span>
                  {model.provider && (
                    <span className="text-xs text-muted-foreground">
                      {model.provider}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }
)

AIModels.displayName = "AIModels"

export { AIModels, type AIModel }
