"use client"

import dynamic from "next/dynamic"

import { SkeletonCard } from "@/components/skeleton-card"

// Dynamically import ReactFlow and heavy compose editor
const ComposeClient = dynamic(
  () => import("./compose-client").then((mod) => mod.ComposeClient),
  {
    loading: () => (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <SkeletonCard className="h-[400px]" />
          <div className="flex gap-2">
            <div className="h-10 flex-1 bg-muted animate-pulse rounded" />
            <div className="h-10 flex-1 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    ),
    ssr: false, // ReactFlow requires client-side rendering
  }
)

export default function ComposePage() {
  return <ComposeClient />
}
