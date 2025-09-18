import * as React from 'react'
import { cn } from '../../lib/utils'

export interface AIChatProps extends React.HTMLAttributes<HTMLDivElement> {
  provider?: string
  model?: string
  apiKey?: string
  welcomeMessage?: string
  placeholder?: string
  streaming?: boolean
  history?: Array<{ role: string; content: string }>
  maxMessages?: number
  onMessage?: (message: { role: string; content: string }) => void
  onError?: (error: Error) => void
}

export const AIChat = React.forwardRef<HTMLDivElement, AIChatProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col h-full w-full', className)}
        {...props}
      >
        <div className="flex-1 overflow-auto p-4">
          {/* Chat messages */}
          <div className="space-y-4">
            {props.welcomeMessage && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">{props.welcomeMessage}</p>
              </div>
            )}
            {children}
          </div>
        </div>
        <div className="p-4 border-t">
          <input
            type="text"
            placeholder={props.placeholder || "Type your message..."}
            className="w-full p-2 border rounded-lg"
          />
        </div>
      </div>
    )
  }
)
AIChat.displayName = 'AIChat'