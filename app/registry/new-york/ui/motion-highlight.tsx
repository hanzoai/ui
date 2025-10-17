"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface MotionHighlightProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const MotionHighlight = React.forwardRef<HTMLDivElement, MotionHighlightProps>(
  ({ className, children, ...props }, ref) => {
    const [highlightPosition, setHighlightPosition] = React.useState({
      x: 0,
      y: 0,
    })
    const [isHovered, setIsHovered] = React.useState(false)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      setHighlightPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }

    return (
      <div
        ref={ref}
        className={cn("group relative overflow-hidden", className)}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {isHovered && (
          <div
            className="pointer-events-none absolute z-0 h-32 w-32 rounded-full bg-primary/10 blur-xl transition-opacity"
            style={{
              left: highlightPosition.x,
              top: highlightPosition.y,
              transform: "translate(-50%, -50%)",
            }}
          />
        )}
        <div className="relative z-10">{children}</div>
      </div>
    )
  }
)
MotionHighlight.displayName = "MotionHighlight"

export { MotionHighlight }
