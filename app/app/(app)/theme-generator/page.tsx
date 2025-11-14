"use client"

import dynamic from "next/dynamic"

import { SkeletonCard } from "@/components/skeleton-card"

// Dynamically import the color picker library and theme generator
const ThemeGeneratorClient = dynamic(
  () =>
    import("./theme-generator-client").then(
      (mod) => mod.ThemeGeneratorClient
    ),
  {
    loading: () => (
      <div className="container max-w-[1600px] py-6">
        <div className="space-y-6">
          <div>
            <div className="h-12 w-64 bg-muted animate-pulse rounded" />
            <div className="h-6 w-96 bg-muted animate-pulse rounded mt-2" />
          </div>
          <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <SkeletonCard className="h-[600px]" />
          </div>
        </div>
      </div>
    ),
    ssr: false, // Color picker needs client-side rendering
  }
)

export default function ThemeGeneratorPage() {
  return <ThemeGeneratorClient />
}
