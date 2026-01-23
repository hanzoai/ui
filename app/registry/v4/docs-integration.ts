/**
 * Hanzo UI - Documentation Integration
 *
 * Provides integration with ~/work/hanzo/docs for component documentation.
 * This module exports utilities to generate documentation from registry items.
 */

import { type RegistryItem, type Registry } from "./schema"
import { registry } from "./registry"
import { STYLES } from "./styles"
import { BASES } from "./bases"
import { THEMES } from "./themes"

/**
 * Documentation metadata for a component
 */
export interface ComponentDoc {
  name: string
  title: string
  description: string
  category: string
  subcategory?: string
  dependencies: string[]
  registryDependencies: string[]
  files: string[]
  type: string
  examples?: string[]
  apiReference?: string
}

/**
 * Convert a registry item to documentation format
 */
export function toComponentDoc(item: RegistryItem): ComponentDoc {
  return {
    name: item.name,
    title: item.title ?? item.name,
    description: item.description ?? "",
    category: item.category ?? "ui",
    subcategory: item.subcategory,
    dependencies: item.dependencies ?? [],
    registryDependencies: item.registryDependencies ?? [],
    files: item.files?.map((f) => (typeof f === "string" ? f : f.path)) ?? [],
    type: item.type,
  }
}

/**
 * Get all components organized by category for documentation
 */
export function getComponentsByCategory(): Record<string, ComponentDoc[]> {
  const categories: Record<string, ComponentDoc[]> = {}

  for (const item of registry.items) {
    const category = item.category ?? "ui"
    if (!categories[category]) {
      categories[category] = []
    }
    categories[category].push(toComponentDoc(item))
  }

  return categories
}

/**
 * Get documentation for all styles
 */
export function getStyleDocs() {
  return STYLES.map((style) => ({
    name: style.name,
    title: style.title,
    description: style.description,
  }))
}

/**
 * Get documentation for all bases
 */
export function getBaseDocs() {
  return BASES.map((base) => ({
    name: base.name,
    title: base.title,
    description: base.description,
    dependencies: base.dependencies,
  }))
}

/**
 * Get documentation for all themes
 */
export function getThemeDocs() {
  return THEMES.map((theme) => ({
    name: theme.name,
    title: theme.title,
    style: theme.style,
    baseColor: theme.baseColor,
  }))
}

/**
 * Generate MDX frontmatter for a component
 */
export function generateMdxFrontmatter(item: RegistryItem): string {
  const doc = toComponentDoc(item)
  return `---
title: ${doc.title}
description: ${doc.description}
category: ${doc.category}
${doc.subcategory ? `subcategory: ${doc.subcategory}` : ""}
---`
}

/**
 * Generate installation instructions for a component
 */
export function generateInstallInstructions(item: RegistryItem): string {
  const deps = item.dependencies ?? []
  const regDeps = item.registryDependencies ?? []

  let instructions = `## Installation

\`\`\`bash
npx hanzo-ui add ${item.name}
\`\`\`
`

  if (deps.length > 0) {
    instructions += `
### Dependencies

This component requires the following npm packages:

\`\`\`bash
npm install ${deps.join(" ")}
\`\`\`
`
  }

  if (regDeps.length > 0) {
    instructions += `
### Registry Dependencies

This component also requires these registry components:

${regDeps.map((dep) => `- \`${dep}\``).join("\n")}
`
  }

  return instructions
}

/**
 * Export format compatible with @hanzo/docs-cli/build Registry
 */
export function toDocsRegistry(): {
  name: string
  components: Array<{
    name: string
    title?: string
    description?: string
    files: Array<{
      type: string
      path: string
      target?: string
    }>
  }>
} {
  return {
    name: "hanzo-ui",
    components: registry.items.map((item) => ({
      name: item.name,
      title: item.title,
      description: item.description,
      files:
        item.files?.map((f) => {
          if (typeof f === "string") {
            return { type: "components", path: f }
          }
          return {
            type: f.type.replace("registry:", ""),
            path: f.path,
            target: f.target,
          }
        }) ?? [],
    })),
  }
}

/**
 * Categories with descriptions for documentation navigation
 */
export const CATEGORY_DOCS = {
  ui: {
    title: "UI Components",
    description: "Core UI components built on Radix or Base UI primitives",
  },
  ai: {
    title: "AI Components",
    description: "AI-specific components for chat, agents, vision, voice, and code",
  },
  finance: {
    title: "Finance Components",
    description:
      "Financial components including TradingView widgets, screeners, and portfolio management",
  },
  "3d": {
    title: "3D Components",
    description: "WebGL and Three.js components for immersive experiences",
  },
  animation: {
    title: "Animation Components",
    description: "Framer Motion based animation components",
  },
  code: {
    title: "Code Components",
    description: "Code editing, viewing, and developer tool components",
  },
}
