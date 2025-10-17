"use client"

import * as React from "react"
import { Check, X } from "lucide-react"

import { cn } from "@/lib/utils"

export interface ComparisonItem {
  label: string
  value: boolean | string
}

export interface ComparisonColumn {
  title: string
  items: ComparisonItem[]
  highlighted?: boolean
}

export interface ComparisonProps extends React.HTMLAttributes<HTMLDivElement> {
  columns: ComparisonColumn[]
}

const Comparison = React.forwardRef<HTMLDivElement, ComparisonProps>(
  ({ className, columns, ...props }, ref) => {
    const maxItems = Math.max(...columns.map((col) => col.items.length))

    return (
      <div ref={ref} className={cn("overflow-x-auto", className)} {...props}>
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
        >
          {columns.map((column, colIndex) => (
            <div
              key={colIndex}
              className={cn(
                "rounded-lg border p-6",
                column.highlighted && "border-primary shadow-lg"
              )}
            >
              <h3 className="mb-6 text-lg font-semibold">{column.title}</h3>
              <div className="space-y-4">
                {column.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center gap-3">
                    {typeof item.value === "boolean" ? (
                      item.value ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-red-500" />
                      )
                    ) : (
                      <span className="font-medium">{item.value}</span>
                    )}
                    <span className="text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
)
Comparison.displayName = "Comparison"

export { Comparison }
