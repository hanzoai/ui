"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/registry/new-york/ui/badge"

interface ShowcaseItem {
  id: string
  title: string
  count: string
  image: string
  imageDark: string
  badge?: string
  href: string
}

const items: ShowcaseItem[] = [
  {
    id: "1",
    title: "Landing Pages",
    count: "8 examples",
    image: "/placeholder.svg?height=480&width=708",
    imageDark: "/placeholder.svg?height=480&width=708",
    href: "#",
  },
  {
    id: "2",
    title: "Pricing Pages",
    count: "5 examples",
    image: "/placeholder.svg?height=480&width=708",
    imageDark: "/placeholder.svg?height=480&width=708",
    badge: "New",
    href: "#",
  },
  {
    id: "3",
    title: "About Pages",
    count: "4 examples",
    image: "/placeholder.svg?height=480&width=708",
    imageDark: "/placeholder.svg?height=480&width=708",
    href: "#",
  },
]

export default function BlockShowcaseMarketing01() {
  return (
    <section className="container px-4 py-24 mx-auto">
      <div className="mb-8">
        <h3 className="font-mono text-sm font-medium tracking-widest uppercase text-muted-foreground">
          Marketing Pages
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className="block transition hover:bg-accent rounded-lg"
          >
            <div className="relative p-2">
              <img
                src={item.image}
                alt={item.title}
                className="aspect-[708/480] w-full rounded-md border shadow-sm dark:hidden"
              />
              <img
                src={item.imageDark}
                alt={item.title}
                className="aspect-[708/480] w-full rounded-md border shadow-sm hidden dark:block"
              />
            </div>
            <div className="px-4 py-2 sm:px-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{item.title}</p>
                {item.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
              </div>
              <p className="font-mono text-xs text-muted-foreground">
                {item.count}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
