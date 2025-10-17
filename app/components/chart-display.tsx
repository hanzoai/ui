import * as React from "react"

import { cn } from "@/lib/utils"

export function ChartDisplay({
  name,
  children,
  className,
}: {
  name: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "themes-wrapper group relative flex flex-col overflow-hidden rounded-xl border shadow transition-all duration-200 ease-in-out hover:z-30",
        className
      )}
    >
      <div className="relative z-10 [&>div]:rounded-none [&>div]:border-none [&>div]:shadow-none">
        {children}
      </div>
    </div>
  )
}
