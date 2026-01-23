/**
 * Hanzo UI - Registry Schema
 *
 * Schema definitions for the v4 registry system.
 * Compatible with shadcn v4 while supporting Hanzo-specific extensions.
 */

import { z } from "zod"

// File types that can be registered
export const registryItemTypeSchema = z.enum([
  "registry:style",
  "registry:lib",
  "registry:example",
  "registry:block",
  "registry:component",
  "registry:ui",
  "registry:hook",
  "registry:theme",
  "registry:page",
  "registry:file",
  "registry:base",
  // Hanzo-specific types
  "registry:ai",
  "registry:finance",
  "registry:3d",
  "registry:animation",
  "registry:code",
])

export type RegistryItemType = z.infer<typeof registryItemTypeSchema>

// File schema for registry items
export const registryItemFileSchema = z.object({
  path: z.string(),
  content: z.string().optional(),
  type: registryItemTypeSchema.optional(),
  target: z.string().optional(),
})

export type RegistryItemFile = z.infer<typeof registryItemFileSchema>

// CSS variables for themes
export const registryItemCssVarsSchema = z.object({
  theme: z.record(z.string(), z.string()).optional(),
  light: z.record(z.string(), z.string()).optional(),
  dark: z.record(z.string(), z.string()).optional(),
})

export type RegistryItemCssVars = z.infer<typeof registryItemCssVarsSchema>

// Tailwind config
export const registryItemTailwindConfigSchema = z.object({
  theme: z.record(z.string(), z.any()).optional(),
  plugins: z.array(z.string()).optional(),
})

export type RegistryItemTailwindConfig = z.infer<
  typeof registryItemTailwindConfigSchema
>

// Main registry item schema
export const registryItemSchema = z.object({
  // Required
  name: z.string(),
  type: registryItemTypeSchema,

  // Optional metadata
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),

  // Dependencies
  dependencies: z.array(z.string()).optional(),
  devDependencies: z.array(z.string()).optional(),
  registryDependencies: z.array(z.string()).optional(),

  // Files
  files: z.array(z.union([z.string(), registryItemFileSchema])).optional(),

  // Styling
  cssVars: registryItemCssVarsSchema.optional(),
  css: z.record(z.string(), z.any()).optional(),
  tailwind: registryItemTailwindConfigSchema.optional(),

  // Extensions
  extends: z.string().optional(),
  meta: z.record(z.string(), z.any()).optional(),

  // Config (for base items)
  config: z
    .object({
      style: z.string().optional(),
      iconLibrary: z.string().optional(),
      menuColor: z.string().optional(),
      menuAccent: z.string().optional(),
      tailwind: z
        .object({
          baseColor: z.string().optional(),
        })
        .optional(),
    })
    .optional(),

  // Component (for runtime registry)
  component: z.any().optional(),
  source: z.string().optional(),
  chunks: z.array(z.any()).optional(),
})

export type RegistryItem = z.infer<typeof registryItemSchema>

// Full registry schema
export const registrySchema = z.object({
  name: z.string(),
  homepage: z.string().optional(),
  items: z.array(registryItemSchema),
})

export type Registry = z.infer<typeof registrySchema>

// Legacy registry type (for backward compatibility)
export type LegacyRegistry = RegistryItem[]
