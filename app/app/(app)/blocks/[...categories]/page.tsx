import { Suspense } from "react"

import { getAllBlockIds } from "@/lib/blocks"
import { registryCategories } from "@/lib/categories"
import { BlockDisplay } from "@/components/block-display"
import { SkeletonCardGrid } from "@/components/skeleton-card"

export const revalidate = false
export const dynamic = "force-static"
export const dynamicParams = false

export async function generateStaticParams() {
  return registryCategories.map((category) => ({
    categories: [category.slug],
  }))
}

async function BlockGallery({ categories }: { categories: string[] }) {
  const blocks = await getAllBlockIds(["registry:block"], categories)

  return (
    <>
      {blocks.map((name) => (
        <BlockDisplay name={name} key={name} />
      ))}
    </>
  )
}

export default async function BlocksPage({
  params,
}: {
  params: Promise<{ categories?: string[] }>
}) {
  const { categories = [] } = await params

  return (
    <div className="flex flex-col gap-12 md:gap-24">
      <Suspense fallback={<SkeletonCardGrid count={9} />}>
        <BlockGallery categories={categories} />
      </Suspense>
    </div>
  )
}
