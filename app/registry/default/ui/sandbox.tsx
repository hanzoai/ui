"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface SandboxProps extends React.HTMLAttributes<HTMLDivElement> {
  code?: string
  language?: string
  editable?: boolean
}

const Sandbox = React.forwardRef<HTMLDivElement, SandboxProps>(
  (
    {
      className,
      code = "",
      language = "javascript",
      editable = false,
      ...props
    },
    ref
  ) => {
    const [value, setValue] = React.useState(code)
    const [output, setOutput] = React.useState<string>("")

    const handleRun = () => {
      try {
        // This is a placeholder - in production, use a proper sandboxed execution environment
        const result = eval(value)
        setOutput(String(result))
      } catch (error) {
        setOutput(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid gap-4 rounded-lg border bg-card text-card-foreground shadow-sm",
          className
        )}
        {...props}
      >
        <div className="space-y-2 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Code Editor</span>
            <button
              onClick={handleRun}
              className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90"
            >
              Run
            </button>
          </div>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            readOnly={!editable}
            className="min-h-[200px] w-full rounded-md border bg-muted p-4 font-mono text-sm"
            placeholder="Enter your code here..."
          />
        </div>

        {output && (
          <div className="space-y-2 border-t p-4">
            <span className="text-sm font-medium">Output</span>
            <pre className="rounded-md bg-muted p-4 text-sm">
              <code>{output}</code>
            </pre>
          </div>
        )}
      </div>
    )
  }
)

Sandbox.displayName = "Sandbox"

export { Sandbox }
