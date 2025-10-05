"use client"

import * as React from "react"
import { motion } from "motion"

import { cn } from "@/lib/utils"

interface Pin3DProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  href?: string
}

const Pin3D = React.forwardRef<HTMLDivElement, Pin3DProps>(
  ({ className, title, href, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("group/pin relative cursor-pointer", className)}
        {...props}
      >
        <div className="pointer-events-none absolute inset-0 z-10 flex h-full w-full items-center justify-center opacity-0 transition duration-500 group-hover/pin:opacity-100">
          <div className="relative flex h-full w-full items-center justify-center">
            <div className="absolute inset-0 bg-white opacity-0 transition duration-500 group-hover/pin:opacity-50" />
          </div>
        </div>
        <div className="transform-gpu transition duration-500 group-hover/pin:scale-95">
          {children}
        </div>
      </div>
    )
  }
)

Pin3D.displayName = "Pin3D"

export { Pin3D }
