import { Suspense } from "react"
import Link from "next/link"

import { BlockDisplay } from "@/components/block-display"
import { SkeletonCardGrid } from "@/components/skeleton-card"
import { Button } from "@/registry/default/ui/button"

export const dynamic = "force-static"
export const revalidate = false

const FEATURED_BLOCKS = [
  "dashboard-01",
  "sidebar-07",
  "sidebar-03",
  "login-03",
  "login-04",
]

// Single theme system - no style parameter needed
export default function BlocksPage() {
  return (
    <div className="flex flex-col gap-12 md:gap-24">
      <Suspense fallback={<SkeletonCardGrid count={5} />}>
        {FEATURED_BLOCKS.map((name) => (
          <BlockDisplay name={name} key={name} />
        ))}
      </Suspense>
      <div className="container-wrapper">
        <div className="container flex justify-center py-6">
          <Button asChild variant="outline">
            <Link href="/blocks/sidebar">Browse more blocks</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
