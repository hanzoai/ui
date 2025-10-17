"use client"

import * as React from "react"
import { Search, ShoppingCart, User } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/new-york/ui/button"

export interface ECommerceNavigationBarProps
  extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode
  categories?: Array<{ label: string; href: string }>
  cartCount?: number
}

const ECommerceNavigationBar = React.forwardRef<
  HTMLElement,
  ECommerceNavigationBarProps
>(({ className, logo, categories = [], cartCount = 0, ...props }, ref) => {
  return (
    <nav ref={ref} className={cn("border-b", className)} {...props}>
      <div className="container flex h-16 items-center justify-between">
        {logo && <div className="font-bold">{logo}</div>}
        <div className="flex gap-6">
          {categories.map((cat) => (
            <a key={cat.href} href={cat.href} className="text-sm font-medium">
              {cat.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </nav>
  )
})
ECommerceNavigationBar.displayName = "ECommerceNavigationBar"

export { ECommerceNavigationBar }
