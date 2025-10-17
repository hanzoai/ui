"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface MenuDockItem {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  active?: boolean
}

export interface MenuDockProps extends React.HTMLAttributes<HTMLDivElement> {
  items: MenuDockItem[]
  orientation?: "horizontal" | "vertical"
}

const MenuDock = React.forwardRef<HTMLDivElement, MenuDockProps>(
  ({ className, items, orientation = "horizontal", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex gap-2 rounded-full border bg-background/95 p-2 shadow-lg backdrop-blur",
          orientation === "vertical" ? "flex-col" : "flex-row",
          className
        )}
        {...props}
      >
        {items.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className={cn(
              "group relative flex items-center justify-center rounded-full p-3 transition-colors hover:bg-accent",
              item.active &&
                "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            title={item.label}
          >
            {item.icon}
            <span className="sr-only">{item.label}</span>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 transition-opacity group-hover:opacity-100">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    )
  }
)
MenuDock.displayName = "MenuDock"

export { MenuDock }
