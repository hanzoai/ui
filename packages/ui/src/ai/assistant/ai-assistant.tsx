import * as React from 'react'
import { cn } from '../../lib/utils'

export interface AIAssistantProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onError'> {
  provider?: string
  model?: string
  apiKey?: string
  systemPrompt?: string
  tools?: Array<{ name: string; description: string; parameters?: any }>
  onResponse?: (response: any) => void
  onError?: (error: Error) => void
}

export const AIAssistant = React.forwardRef<HTMLDivElement, AIAssistantProps>(
  ({ className, children, onError, onResponse, provider, model, apiKey, systemPrompt, tools, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-4 p-4', className)}
        {...props}
      >
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium">AI</span>
          </div>
          <span className="text-sm font-medium">AI Assistant</span>
        </div>
        <div className="flex-1">{children}</div>
      </div>
    )
  }
)
AIAssistant.displayName = 'AIAssistant'