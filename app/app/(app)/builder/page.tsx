"use client"

import * as React from "react"
import dynamic from "next/dynamic"

import { SkeletonCard } from "@/components/skeleton-card"

// Dynamically import the heavy builder component
const EnhancedBuilderClient = dynamic(
  () => import("./builder-client").then((mod) => mod.EnhancedBuilderClient),
  {
    loading: () => (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    ),
    ssr: false, // Builder is interactive and client-only
  }
)

export default function BuilderPage() {
  return <EnhancedBuilderClient />
}
