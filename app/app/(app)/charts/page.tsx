"use client"

import dynamic from "next/dynamic"

import { SkeletonCardGrid } from "@/components/skeleton-card"

// Dynamically import heavy chart components
const ChartsClient = dynamic(
  () => import("./charts-client").then((mod) => mod.ChartsClient),
  {
    loading: () => (
      <div className="container mx-auto py-10">
        <div className="space-y-6">
          <div>
            <div className="h-10 w-48 bg-muted animate-pulse rounded" />
            <div className="h-6 w-96 bg-muted animate-pulse rounded mt-2" />
          </div>
          <SkeletonCardGrid count={9} />
        </div>
      </div>
    ),
    ssr: false, // Charts are interactive with Recharts
  }
)

export default function ChartsPage() {
  return <ChartsClient />
}
