"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface CursorProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  cursorText?: string
  cursorSize?: number
}

const Cursor = React.forwardRef<HTMLDivElement, CursorProps>(
  ({ className, children, cursorText, cursorSize = 20, ...props }, ref) => {
    const [position, setPosition] = React.useState({ x: 0, y: 0 })
    const [isHovered, setIsHovered] = React.useState(false)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }

    return (
      <div
        ref={ref}
        className={cn("relative cursor-none", className)}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {children}
        {isHovered && (
          <div
            className="pointer-events-none absolute z-50 flex items-center justify-center rounded-full bg-primary/20 backdrop-blur-sm transition-transform"
            style={{
              left: position.x,
              top: position.y,
              width: cursorSize,
              height: cursorSize,
              transform: "translate(-50%, -50%)",
            }}
          >
            {cursorText && (
              <span className="text-xs font-medium text-primary">
                {cursorText}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }
)
Cursor.displayName = "Cursor"

export { Cursor }
