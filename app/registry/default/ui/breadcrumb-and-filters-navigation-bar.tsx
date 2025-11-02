"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface BreadcrumbAndFiltersNavigationBarProps
  extends React.HTMLAttributes<HTMLElement> {
  items?: Array<{ label: string; href: string }>
}

const BreadcrumbAndFiltersNavigationBar = React.forwardRef<
  HTMLElement,
  BreadcrumbAndFiltersNavigationBarProps
>(({ className, items = [], ...props }, ref) => {
  return (
    <nav
      ref={ref}
      className={cn("border-b bg-background", className)}
      {...props}
    >
      <div className="container flex h-16 items-center gap-6">
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
    </nav>
  )
})
BreadcrumbAndFiltersNavigationBar.displayName =
  "BreadcrumbAndFiltersNavigationBar"

export { BreadcrumbAndFiltersNavigationBar }
