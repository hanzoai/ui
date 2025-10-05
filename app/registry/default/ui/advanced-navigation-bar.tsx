"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/registry/default/ui/navigation-menu"

interface NavItem {
  title: string
  href?: string
  description?: string
  children?: NavItem[]
}

interface AdvancedNavigationBarProps extends React.HTMLAttributes<HTMLElement> {
  items: NavItem[]
  logo?: React.ReactNode
}

const AdvancedNavigationBar = React.forwardRef<
  HTMLElement,
  AdvancedNavigationBarProps
>(({ className, items, logo, ...props }, ref) => {
  return (
    <nav
      ref={ref}
      className={cn(
        "flex items-center justify-between border-b px-6 py-3",
        className
      )}
      {...props}
    >
      {logo && <div className="flex-shrink-0">{logo}</div>}

      <NavigationMenu>
        <NavigationMenuList>
          {items.map((item, index) => (
            <NavigationMenuItem key={index}>
              {item.children ? (
                <>
                  <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                      {item.children.map((child, childIndex) => (
                        <li key={childIndex}>
                          <NavigationMenuLink asChild>
                            <a
                              href={child.href}
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            >
                              <div className="text-sm font-medium leading-none">
                                {child.title}
                              </div>
                              {child.description && (
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  {child.description}
                                </p>
                              )}
                            </a>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </>
              ) : (
                <NavigationMenuLink asChild>
                  <Button variant="ghost" asChild>
                    <a href={item.href}>{item.title}</a>
                  </Button>
                </NavigationMenuLink>
              )}
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  )
})

AdvancedNavigationBar.displayName = "AdvancedNavigationBar"

export { AdvancedNavigationBar, type NavItem }
