import * as React from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"

import { siteConfig } from "@/config/site"
import { getRegistryComponent, getRegistryItem } from "@/lib/registry"
import { absoluteUrl, cn } from "@/lib/utils"

export const revalidate = false
export const dynamic = "force-static"
export const dynamicParams = false

// Single theme system - no style parameter needed

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    name: string
  }>
}): Promise<Metadata> {
  const { name } = await params

  const item = await getRegistryItem(name)

  if (!item) {
    return {}
  }

  const title = item.name
  const description = item.description

  return {
    title: item.name,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: absoluteUrl(`/view/${item.name}`),
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [siteConfig.ogImage],
      creator: "@hanzoai",
    },
  }
}

export async function generateStaticParams() {
  const { Index } = await import("@/__registry__")
  const params: Array<{ name: string }> = []

  // Single theme system - iterate directly over Index
  for (const itemName in Index) {
    const item = Index[itemName]
    if (
      item.type === "components:block" ||
      item.type === "components:component" ||
      item.type === "components:example"
    ) {
      params.push({
        name: item.name,
      })
    }
  }

  return params
}

export default async function ViewPage({
  params,
}: {
  params: Promise<{
    name: string
  }>
}) {
  const { name } = await params

  const item = await getRegistryItem(name)
  const Component = getRegistryComponent(name)

  if (!item || !Component) {
    return notFound()
  }

  return (
    <>
      <div className={cn("bg-background", item.meta?.container)}>
        <Component />
      </div>
    </>
  )
}
