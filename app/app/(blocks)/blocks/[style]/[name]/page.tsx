import { Metadata } from "next"
import { notFound } from "next/navigation"

import { siteConfig } from "@/config/site"
import { getAllBlockIds, getBlock } from "@/lib/blocks"
import { absoluteUrl, cn } from "@/lib/utils"
import { Style, styles } from "@/registry/styles"

import "@/styles/mdx.css"
import "public/registry/themes.css"

import { AnimatePresence } from "motion/react"

import { BlockChunk } from "@/components/block-chunk"
import { BlockWrapper } from "@/components/block-wrapper"

export async function generateMetadata({
  params,
}: {
  params: {
    style: Style["name"]
    name: string
  }
}): Promise<Metadata> {
  const { name, style } = params
  const block = await getBlock(name, style)

  if (!block) {
    return {}
  }

  return {
    title: block.name,
    description: block.description,
    openGraph: {
      title: block.name,
      description: block.description,
      type: "article",
      url: absoluteUrl(`/blocks/${block.name}`),
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
      title: block.name,
      description: block.description,
      images: [siteConfig.ogImage],
      creator: "@hanzoai",
    },
  }
}

export async function generateStaticParams() {
  const blockIds = await getAllBlockIds()
  return styles
    .map((style) =>
      blockIds.map((name) => ({
        style: style.name,
        name,
      }))
    )
    .flat()
}

export default async function BlockPage({
  params,
}: {
  params: {
    style: Style["name"]
    name: string
  }
}) {
  const { name, style } = params
  const block = await getBlock(name, style)

  if (!block) {
    return notFound()
  }

  const Component = block.component

  // Create serializable copy of block for client components
  const serializableBlock = {
    ...block,
    component: undefined,
    chunks: block.chunks?.map(({ component, ...chunk }) => chunk) || [],
  }

  // Keep original chunks with components for server-side rendering
  const chunks = block.chunks || []

  return (
    <div className={cn(block.container?.className || "", "theme-zinc")}>
      <BlockWrapper block={serializableBlock}>
        <Component />
        {chunks.map((chunk, index) => {
          const ChunkComponent = chunk.component
          return (
            <BlockChunk
              key={chunk.name}
              block={serializableBlock}
              chunk={serializableBlock.chunks?.[index]}
            >
              {ChunkComponent && <ChunkComponent />}
            </BlockChunk>
          )
        })}
      </BlockWrapper>
    </div>
  )
}
