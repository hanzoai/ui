import * as React from 'react'
import { cn } from '../../lib/utils'

export interface AIAgentsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onError'> {
  agents?: Array<{ id: string; name: string; role: string; capabilities: string[] }>
  onAgentSelect?: (agentId: string) => void
  onMessage?: (agentId: string, message: string) => void
}

export const AIAgents = React.forwardRef<HTMLDivElement, AIAgentsProps>(
  ({ className, children, agents = [], onAgentSelect, onTaskComplete, onError, provider, model, apiKey, maxAgents, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}
        {...props}
      >
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => props.onAgentSelect?.(agent.id)}
          >
            <h3 className="font-semibold">{agent.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{agent.role}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {agent.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="text-xs bg-muted px-2 py-0.5 rounded-full"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>
        ))}
        {children}
      </div>
    )
  }
)
AIAgents.displayName = 'AIAgents'