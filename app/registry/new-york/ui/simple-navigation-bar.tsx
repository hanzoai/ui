"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface SimpleNavigationBarProps
  extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode
  items?: Array<{ label: string; href: string }>
}

const SimpleNavigationBar = React.forwardRef<
  HTMLElement,
  SimpleNavigationBarProps
>(({ className, logo, items = [], ...props }, ref) => {
  return (
    <nav ref={ref} className={cn("border-b", className)} {...props}>
      <div className="container flex h-16 items-center justify-between">
        {logo && <div className="font-semibold">{logo}</div>}
        <div className="flex gap-6">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
})
SimpleNavigationBar.displayName = "SimpleNavigationBar"

export { SimpleNavigationBar }
