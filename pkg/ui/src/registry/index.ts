import { z } from "zod"

// Define the file schema to match hanzo/ui's format
export const fileSchema = z.object({
  path: z.string(),
  content: z.string().optional(),
  type: z.string(),
  target: z.string().optional(),
})

// Registry item schema aligned with hanzo/ui format
export const registryItemSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  devDependencies: z.array(z.string()).optional(),
  registryDependencies: z.array(z.string()).optional(),
  files: z.array(fileSchema).optional(),
  meta: z.record(z.string(), z.any()).optional(),
  title: z.string().optional(),
  cssVars: z.record(z.string(), z.any()).optional(),
  tailwind: z.record(z.string(), z.any()).optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
})

// Registry schema aligned with hanzo/ui format
export const registrySchema = z.object({
  $schema: z.string().optional(),
  name: z.string(),
  homepage: z.string().optional(),
  style: z.string().optional(),
  items: z.array(registryItemSchema),
})

// Schema for a registry with full content
export const registryWithContentSchema = registrySchema.extend({
  items: z.array(
    registryItemSchema.extend({
      files: z.array(
        fileSchema.extend({
          content: z.string(),
        })
      ),
    })
  ),
})

// Type definitions for easier use in TypeScript
export type RegistryItem = z.infer<typeof registryItemSchema>
export type Registry = z.infer<typeof registrySchema>
export type RegistryWithContent = z.infer<typeof registryWithContentSchema>
export type RegistryFile = z.infer<typeof fileSchema>

// Support CommonJS
if (typeof module !== 'undefined') {
  module.exports = { fileSchema, registryItemSchema, registrySchema, registryWithContentSchema }
}
