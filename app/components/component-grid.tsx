"use client"

import Link from "next/link"

import { docsConfig } from "@/config/docs"
import { cn } from "@/lib/utils"
import { Badge } from "@/registry/default/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card"

export function ComponentGrid() {
  // Get all component sections from sidebar config
  const componentSections = docsConfig.sidebarNav.filter(
    (section) =>
      section.title !== "Getting Started" &&
      section.title !== "Blocks" &&
      section.title !== "Charts" &&
      section.title !== "Frameworks" &&
      section.title !== "Packages" &&
      section.title !== "Testing" &&
      section.title !== "White-Label"
  )

  return (
    <div className="space-y-12">
      {componentSections.map((section) => (
        <div key={section.title} className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {section.title}
            </h2>
            <p className="text-muted-foreground">
              {getSectionDescription(section.title)}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item) => (
              <Link key={item.href} href={item.href || "#"}>
                <Card className="group relative overflow-hidden transition-all hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-medium group-hover:text-primary transition-colors">
                          {item.title}
                        </CardTitle>
                        {item.label && (
                          <Badge variant="secondary" className="text-xs">
                            {item.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
      <div className="rounded-lg border bg-muted/50 p-8 text-center">
        <h3 className="text-lg font-semibold">Can't find what you need?</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Try the{" "}
          <Link
            href="/docs/registry"
            className="font-medium underline underline-offset-4"
          >
            registry directory
          </Link>{" "}
          for community-maintained components.
        </p>
      </div>
    </div>
  )
}

function getSectionDescription(title: string): string {
  const descriptions: Record<string, string> = {
    Components: "Re-usable components built using Radix UI and Tailwind CSS.",
    "Code Components": "Components for displaying and editing code.",
    "Project Management": "Components for managing projects and tasks.",
    "Device Mockups": "Realistic device mockups for showcasing your work.",
    "Dock Components": "macOS-style dock components with animations.",
    "Form Components": "Advanced form inputs and controls.",
    "3D Components": "Three-dimensional UI components with depth.",
    "Animation Components": "Animated components with beautiful effects.",
    "UI Elements": "Essential UI building blocks.",
    "Navigation Bars": "Navigation bars for different use cases.",
    "Utility Components": "Helpful utility components.",
    "AI Components": "AI-powered interactive components.",
  }
  return descriptions[title] || ""
}
