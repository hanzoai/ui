import { docs } from "@/.source/server"
import { loader } from "@hanzo/docs-core/source"
import type { InferPageType } from "@hanzo/docs-core/source"

export const source = loader({
  baseUrl: "/docs",
  source: docs.toSource(),
})

// Extend PageData with custom frontmatter fields
export type Page = InferPageType<typeof source>

// Type augmentation for custom frontmatter
declare module "@hanzo/docs-core/source" {
  interface PageData {
    links?: {
      doc?: string
      api?: string
    }
  }
}
