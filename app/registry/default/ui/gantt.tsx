"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface GanttProps extends React.HTMLAttributes<HTMLDivElement> {
  tasks?: Array<{
    id: string
    name: string
    start: Date
    end: Date
    progress?: number
  }>
}

const Gantt = React.forwardRef<HTMLDivElement, GanttProps>(
  ({ className, tasks = [], ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow-sm",
          className
        )}
        {...props}
      >
        <div className="p-6">
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-sm text-muted-foreground">
                  No tasks available. Add tasks to display Gantt chart.
                </p>
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{task.name}</span>
                    <span className="text-muted-foreground">
                      {task.progress ?? 0}%
                    </span>
                  </div>
                  <div className="h-8 rounded-md bg-muted">
                    <div
                      className="h-full rounded-md bg-primary"
                      style={{ width: `${task.progress ?? 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{task.start.toLocaleDateString()}</span>
                    <span>{task.end.toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }
)

Gantt.displayName = "Gantt"

export { Gantt }
