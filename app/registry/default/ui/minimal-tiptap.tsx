"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface MinimalTiptapProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value?: string
  onChange?: (value: string) => void
}

const MinimalTiptap = React.forwardRef<HTMLTextAreaElement, MinimalTiptapProps>(
  ({ className, value, onChange, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          "min-h-[200px] w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    )
  }
)
MinimalTiptap.displayName = "MinimalTiptap"

export { MinimalTiptap }
