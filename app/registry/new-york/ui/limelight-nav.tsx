"use client"

import * as React from "react"
import { Command, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/new-york/ui/button"
import { Input } from "@/registry/new-york/ui/input"

export interface LimelightNavProps extends React.HTMLAttributes<HTMLElement> {
  items?: Array<{ label: string; href: string }>
}

const LimelightNav = React.forwardRef<HTMLElement, LimelightNavProps>(
  ({ className, items = [], ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    React.useEffect(() => {
      const down = (e: KeyboardEvent) => {
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          setIsOpen((open) => !open)
        }
      }
      document.addEventListener("keydown", down)
      return () => document.removeEventListener("keydown", down)
    }, [])

    const filteredItems = items.filter((item) =>
      item.label.toLowerCase().includes(search.toLowerCase())
    )

    return (
      <>
        <nav
          ref={ref}
          className={cn("flex items-center gap-4", className)}
          {...props}
        >
          <Button
            variant="outline"
            onClick={() => setIsOpen(true)}
            className="relative w-64 justify-start"
          >
            <Search className="mr-2 h-4 w-4" />
            <span className="text-muted-foreground">Search...</span>
            <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <Command className="h-3 w-3" />K
            </kbd>
          </Button>
          {items.slice(0, 4).map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {isOpen && (
          <div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-6 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <Input
                placeholder="Search navigation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="mb-4"
              />
              <div className="max-h-96 space-y-1 overflow-auto">
                {filteredItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block rounded-md px-4 py-2 hover:bg-accent"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    )
  }
)
LimelightNav.displayName = "LimelightNav"

export { LimelightNav }
