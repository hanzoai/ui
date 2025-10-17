"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  repeat?: number
  reverse?: boolean
  pauseOnHover?: boolean
  vertical?: boolean
}

const Marquee = React.forwardRef<HTMLDivElement, MarqueeProps>(
  (
    {
      className,
      children,
      repeat = 2,
      reverse = false,
      pauseOnHover = false,
      vertical = false,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group flex overflow-hidden",
          vertical ? "flex-col" : "flex-row",
          className
        )}
        {...props}
      >
        {Array.from({ length: repeat }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex shrink-0",
              vertical
                ? "animate-marquee-vertical flex-col"
                : "animate-marquee",
              reverse &&
                (vertical
                  ? "[animation-direction:reverse]"
                  : "[animation-direction:reverse]"),
              pauseOnHover && "group-hover:[animation-play-state:paused]"
            )}
          >
            {children}
          </div>
        ))}
      </div>
    )
  }
)
Marquee.displayName = "Marquee"

export { Marquee }
