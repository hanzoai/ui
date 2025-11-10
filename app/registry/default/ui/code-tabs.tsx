"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface CodeTabsProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs?: Array<{
    label: string
    language: string
    code: string
  }>
  defaultTab?: number
}

const CodeTabs = React.forwardRef<HTMLDivElement, CodeTabsProps>(
  ({ className, tabs = [], defaultTab = 0, ...props }, ref) => {
    const [activeTab, setActiveTab] = React.useState(defaultTab)

    if (tabs.length === 0) {
      return (
        <div
          ref={ref}
          className={cn(
            "rounded-lg border bg-card p-6 text-card-foreground shadow-sm",
            className
          )}
          {...props}
        >
          <p className="text-sm text-muted-foreground">
            No code tabs available. Add tabs to display code snippets.
          </p>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow-sm",
          className
        )}
        {...props}
      >
        <div className="border-b">
          <div className="flex gap-1 p-2">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === index
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          <pre className="overflow-x-auto rounded-md bg-muted p-4">
            <code className="text-sm">{tabs[activeTab]?.code}</code>
          </pre>
        </div>
      </div>
    )
  }
)

CodeTabs.displayName = "CodeTabs"

export { CodeTabs }
