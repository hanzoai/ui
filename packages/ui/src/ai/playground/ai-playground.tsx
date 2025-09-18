import * as React from 'react'
import { cn } from '../../lib/utils'

export interface AIPlaygroundProps extends React.HTMLAttributes<HTMLDivElement> {
  model?: string
  temperature?: number
  maxTokens?: number
}

export function AIPlayground({
  className,
  model = "gpt-4",
  temperature = 0.7,
  maxTokens = 1000,
  ...props
}: AIPlaygroundProps) {
  return (
    <div className={cn("ai-playground", className)} {...props}>
      {/* AI Playground implementation */}
      <div className="playground-container">
        <h2>AI Playground</h2>
        <p>Model: {model}</p>
        <p>Temperature: {temperature}</p>
        <p>Max Tokens: {maxTokens}</p>
      </div>
    </div>
  )
}
