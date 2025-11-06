import * as React from "react"
import { z } from "zod"

import { highlightCode } from "@/lib/highlight-code"
import {
  createFileTreeForRegistryItemFiles,
  getRegistryItem,
} from "@/lib/registry"
import { registryItemFileSchema } from "@/lib/schemas"
import { cn } from "@/lib/utils"
import { BlockViewer } from "@/components/block-viewer"
import { ComponentPreview } from "@/components/component-preview"

// Single theme system - no style parameter needed
export async function BlockDisplay({ name }: { name: string }) {
  const item = await getRegistryItem(name)

  if (!item?.files) {
    return null
  }

  const tree = item.files ? await createFileTreeForRegistryItemFiles(item.files) : null

  const highlightedFiles = await Promise.all(
    item.files.map(async (file) => ({
      ...file,
      highlightedContent: await highlightCode(file.content ?? ""),
    }))
  )

  return (
    <BlockViewer
      item={item}
      tree={tree}
      highlightedFiles={highlightedFiles}
    >
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
