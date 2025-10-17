"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface IPhone15ProProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  variant?: "default" | "pro-max" | "mini"
  color?: "black" | "white" | "blue" | "natural"
}

const IPhone15Pro = React.forwardRef<HTMLDivElement, IPhone15ProProps>(
  (
    { className, children, variant = "default", color = "black", ...props },
    ref
  ) => {
    const colorClasses = {
      black: "bg-zinc-900 border-zinc-800",
      white: "bg-zinc-100 border-zinc-300",
      blue: "bg-blue-950 border-blue-900",
      natural: "bg-stone-800 border-stone-700",
    }

    return (
      <div ref={ref} className={cn("inline-block", className)} {...props}>
        {/* iPhone Frame */}
        <div
          className={cn(
            "relative mx-auto rounded-[3rem] border-[14px] shadow-2xl",
            colorClasses[color]
          )}
          style={{
            width:
              variant === "pro-max"
                ? "430px"
                : variant === "mini"
                  ? "360px"
                  : "393px",
            height:
              variant === "pro-max"
                ? "932px"
                : variant === "mini"
                  ? "780px"
                  : "852px",
          }}
        >
          {/* Dynamic Island */}
          <div className="absolute left-1/2 top-0 z-10 h-8 w-32 -translate-x-1/2 rounded-b-3xl bg-black" />

          {/* Screen */}
          <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] bg-white">
            {children}
          </div>

          {/* Side Buttons */}
          <div className="absolute -left-[17px] top-32 h-12 w-1 rounded-l-lg bg-zinc-800" />
          <div className="absolute -left-[17px] top-52 h-16 w-1 rounded-l-lg bg-zinc-800" />
          <div className="absolute -left-[17px] top-72 h-16 w-1 rounded-l-lg bg-zinc-800" />
          <div className="absolute -right-[17px] top-44 h-20 w-1 rounded-r-lg bg-zinc-800" />
        </div>
      </div>
    )
  }
)
IPhone15Pro.displayName = "IPhone15Pro"

export { IPhone15Pro }
