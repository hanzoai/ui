import { docs } from "@/.source"
import { loader } from "fumadocs-core/source"
import type { InferPageType } from "fumadocs-core/source"

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
})

// Extend PageData with custom frontmatter fields
export type Page = InferPageType<typeof source>

// Type augmentation for custom frontmatter
declare module "fumadocs-core/source" {
  interface PageData {
    links?: {
      doc?: string
      api?: string
    }
  }
}
