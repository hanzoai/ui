"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface CenteredLogoNavigationBarProps
  extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode
  leftItems?: Array<{ label: string; href: string }>
  rightItems?: Array<{ label: string; href: string }>
}

const CenteredLogoNavigationBar = React.forwardRef<
  HTMLElement,
  CenteredLogoNavigationBarProps
>(({ className, logo, leftItems = [], rightItems = [], ...props }, ref) => {
  return (
    <nav ref={ref} className={cn("border-b", className)} {...props}>
      <div className="container flex h-16 items-center justify-between">
        <div className="flex gap-6">
          {leftItems.map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-medium">
              {item.label}
            </a>
          ))}
        </div>
        {logo && <div className="font-semibold">{logo}</div>}
        <div className="flex gap-6">
          {rightItems.map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-medium">
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
})
CenteredLogoNavigationBar.displayName = "CenteredLogoNavigationBar"

export { CenteredLogoNavigationBar }
