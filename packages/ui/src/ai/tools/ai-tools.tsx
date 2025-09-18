import * as React from 'react'
import { cn } from '../../lib/utils'

export interface AIToolsProps extends React.HTMLAttributes<HTMLDivElement> {
  tools?: Array<{
    name: string
    description: string
    parameters?: Record<string, any>
    execute?: (params: any) => Promise<any>
  }>
  onToolExecute?: (toolName: string, params: any) => void
  onToolResult?: (toolName: string, result: any) => void
}

export const AITools = React.forwardRef<HTMLDivElement, AIToolsProps>(
  ({ className, children, tools = [], ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('space-y-4', className)}
        {...props}
      >
        <div className="grid gap-2">
          {tools.map((tool) => (
            <div
              key={tool.name}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div>
                <h4 className="font-medium text-sm">{tool.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {tool.description}
                </p>
              </div>
              <button
                onClick={() => props.onToolExecute?.(tool.name, tool.parameters)}
                className="px-3 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Execute
              </button>
            </div>
          ))}
        </div>
        {children}
      </div>
    )
  }
)
AITools.displayName = 'AITools'