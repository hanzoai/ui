"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface IconNavigationBarProps
  extends React.HTMLAttributes<HTMLElement> {
  items?: Array<{ icon: React.ReactNode; label: string; href: string }>
}

const IconNavigationBar = React.forwardRef<HTMLElement, IconNavigationBarProps>(
  ({ className, items = [], ...props }, ref) => {
    return (
      <nav ref={ref} className={cn("border-b", className)} {...props}>
        <div className="container flex h-16 items-center justify-center gap-8">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 transition-colors hover:text-primary"
              title={item.label}
            >
              {item.icon}
              <span className="text-xs">{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
    )
  }
)
IconNavigationBar.displayName = "IconNavigationBar"

export { IconNavigationBar }
