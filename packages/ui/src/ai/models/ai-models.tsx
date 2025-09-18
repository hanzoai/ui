import * as React from 'react'
import { cn } from '../../lib/utils'

export interface AIModelsProps extends React.HTMLAttributes<HTMLDivElement> {
  models?: string[]
  selectedModel?: string
  onSelectModel?: (model: string) => void
}

export function AIModels({
  className,
  models = ["gpt-4", "claude-3", "llama-2"],
  selectedModel = "gpt-4",
  onSelectModel,
  ...props
}: AIModelsProps) {
  return (
    <div className={cn("ai-models", className)} {...props}>
      {/* AI Models implementation */}
      <div className="models-container">
        <h2>AI Models</h2>
        <select
          value={selectedModel}
          onChange={(e) => onSelectModel?.(e.target.value)}
        >
          {models.map((model) => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
