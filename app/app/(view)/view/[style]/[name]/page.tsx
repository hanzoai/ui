import * as React from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"

import { siteConfig } from "@/config/site"
import { getRegistryComponent, getRegistryItem } from "@/lib/registry"
import { absoluteUrl, cn } from "@/lib/utils"
import { styles, type Style } from "@/registry/styles"

export const revalidate = false
export const dynamic = "force-static"
export const dynamicParams = false

const getCachedRegistryItem = React.cache(
  async (name: string, styleName: Style["name"]) => {
    return await getRegistryItem(name, styleName)
  }
)

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    style: string
    name: string
  }>
}): Promise<Metadata> {
  const { style: styleName, name } = await params
  const style = styles.find((s) => s.name === styleName)

  if (!style) {
    return {}
  }

  const item = await getCachedRegistryItem(name, style.name)

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
      url: absoluteUrl(`/view/${style.name}/${item.name}`),
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
  const params: Array<{ style: string; name: string }> = []

  for (const style of styles) {
    if (!Index[style.name]) {
      continue
    }

    const styleIndex = Index[style.name]
    for (const itemName in styleIndex) {
      const item = styleIndex[itemName]
      if (
        item.type === "components:block" ||
        item.type === "components:component" ||
        item.type === "components:example"
      ) {
        params.push({
          style: style.name,
          name: item.name,
        })
      }
    }
  }

  return params
}

export default async function ViewPage({
  params,
}: {
  params: Promise<{
    style: string
    name: string
  }>
}) {
  const { style: styleName, name } = await params
  const style = styles.find((s) => s.name === styleName)

  if (!style) {
    return notFound()
  }

  const item = await getCachedRegistryItem(name, style.name)
  const Component = getRegistryComponent(name, style.name)

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
