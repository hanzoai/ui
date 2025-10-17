"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface TickerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  speed?: number
  direction?: "left" | "right"
  pauseOnHover?: boolean
}

const Ticker = React.forwardRef<HTMLDivElement, TickerProps>(
  (
    {
      className,
      children,
      speed = 50,
      direction = "left",
      pauseOnHover = true,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn("group relative overflow-hidden", className)}
        {...props}
      >
        <div
          className={cn(
            "flex w-fit animate-scroll",
            pauseOnHover && "group-hover:[animation-play-state:paused]"
          )}
          style={{
            animationDuration: `${speed}s`,
            animationDirection: direction === "right" ? "reverse" : "normal",
          }}
        >
          {children}
          {children}
        </div>
      </div>
    )
  }
)
Ticker.displayName = "Ticker"

export { Ticker }
