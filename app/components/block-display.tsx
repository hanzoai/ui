import * as React from "react"
import { z } from "zod"

import { getBlock } from "@/lib/blocks"
import { highlightCode } from "@/lib/highlight-code"
import {
  createFileTreeForRegistryItemFiles,
  getRegistryItem,
} from "@/lib/registry"
import { registryItemFileSchema } from "@/lib/schemas"
import { cn } from "@/lib/utils"
import { BlockViewer } from "@/components/block-viewer"
import { BlockWrapper } from "@/components/block-wrapper"
import { ComponentPreview } from "@/components/component-preview"
import { Style } from "@/registry/styles"

interface BlockDisplayProps {
  name: string
  style?: Style["name"]
}

export async function BlockDisplay({
  name,
  style = "default",
}: BlockDisplayProps) {
  // Try to get as a block first (with style support)
  const block = await getCachedBlock(name, style)

  if (block) {
    // Render block using BlockWrapper like the individual block pages do
    const Component = block.component
    const chunks = block.chunks?.map((chunk) => ({ ...chunk }))
    delete block.component
    block.chunks?.map((chunk) => delete chunk.component)

    return (
      <div className={cn(block.container?.className || "", "theme-zinc")}>
        <BlockWrapper block={block}>
          <Component />
        </BlockWrapper>
      </div>
    )
  }

  // Fallback to registry item for non-block components
  const item = await getCachedRegistryItem(name, style)

  if (!item?.files) {
    return null
  }

  const [tree, highlightedFiles] = await Promise.all([
    getCachedFileTree(item.files),
    getCachedHighlightedFiles(item.files),
  ])

  return (
    <BlockViewer item={item} tree={tree} highlightedFiles={highlightedFiles}>
      <ComponentPreview
        name={item.name}
        hideCode
        className={cn(
          "my-0 **:[.preview]:h-auto **:[.preview]:p-4 **:[.preview>.p-6]:p-0",
          item.meta?.containerClassName
        )}
      />
    </BlockViewer>
  )
}

const getCachedBlock = React.cache(
  async (name: string, style: Style["name"]) => {
    try {
      return await getBlock(name, style)
    } catch {
      return null
    }
  }
)

const getCachedRegistryItem = React.cache(async (name: string, style: Style["name"] = "default") => {
  return await getRegistryItem(name, style)
})

const getCachedFileTree = React.cache(
  async (files: Array<{ path: string; target?: string }>) => {
    if (!files) {
      return null
    }

    return await createFileTreeForRegistryItemFiles(files)
  }
)

const getCachedHighlightedFiles = React.cache(
  async (files: z.infer<typeof registryItemFileSchema>[]) => {
    return await Promise.all(
      files.map(async (file) => ({
        ...file,
        highlightedContent: await highlightCode(file.content ?? ""),
      }))
    )
  }
)
