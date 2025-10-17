"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface MagneticProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  strength?: number
}

const Magnetic = React.forwardRef<HTMLDivElement, MagneticProps>(
  ({ className, children, strength = 0.3, ...props }, ref) => {
    const [position, setPosition] = React.useState({ x: 0, y: 0 })
    const elementRef = React.useRef<HTMLDivElement>(null)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const element = elementRef.current
      if (!element) return

      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const deltaX = (e.clientX - centerX) * strength
      const deltaY = (e.clientY - centerY) * strength

      setPosition({ x: deltaX, y: deltaY })
    }

    const handleMouseLeave = () => {
      setPosition({ x: 0, y: 0 })
    }

    return (
      <div
        ref={elementRef}
        className={cn("transition-transform", className)}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Magnetic.displayName = "Magnetic"

export { Magnetic }
