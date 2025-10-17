"use client"

import * as React from "react"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

export interface BreadcrumbNavigationBarProps
  extends React.HTMLAttributes<HTMLElement> {
  items?: Array<{ label: string; href?: string }>
}

const BreadcrumbNavigationBar = React.forwardRef<
  HTMLElement,
  BreadcrumbNavigationBarProps
>(({ className, items = [], ...props }, ref) => {
  return (
    <nav ref={ref} className={cn("border-b", className)} {...props}>
      <div className="container flex h-12 items-center">
        <ol className="flex items-center gap-2 text-sm">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              {item.href ? (
                <a href={item.href} className="hover:text-primary">
                  {item.label}
                </a>
              ) : (
                <span className="text-muted-foreground">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  )
})
BreadcrumbNavigationBar.displayName = "BreadcrumbNavigationBar"

export { BreadcrumbNavigationBar }
