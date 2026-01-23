/**
 * Hanzo UI - Registry Loader
 *
 * Loads and manages registry items for the v4 system.
 * Supports both Radix UI and Base UI bases, plus Hanzo extensions.
 */

import { type RegistryItem, type Registry, registryItemSchema } from "./schema"
import { type BaseName } from "./bases"
import { type StyleName } from "./styles"

// Import base registries
import { radixRegistry } from "./bases/radix/registry"
import { baseRegistry } from "./bases/base/registry"

// Import Hanzo extension registries
import { hanzoAiRegistry } from "./hanzo/ai"
import { hanzoFinanceRegistry } from "./hanzo/finance"
import { hanzo3DRegistry } from "./hanzo/3d"
import { hanzoAnimationRegistry } from "./hanzo/animation"
import { hanzoCodeRegistry } from "./hanzo/code"

// Registry index type
export interface RegistryIndex {
  [styleName: string]: {
    [itemName: string]: RegistryItem & {
      component?: React.ComponentType<any>
    }
  }
}

// Build the registry index
function buildRegistryIndex(): RegistryIndex {
  const index: RegistryIndex = {}

  // Add radix-based registry items
  for (const item of radixRegistry.items) {
    for (const style of ["vega", "nova", "maia", "lyra", "mira", "hanzo"]) {
      const styleName = `radix-${style}`
      if (!index[styleName]) {
        index[styleName] = {}
      }
      index[styleName][item.name] = item
    }
  }

  // Add base-ui registry items
  for (const item of baseRegistry.items) {
    for (const style of ["vega", "nova", "maia", "lyra", "mira", "hanzo"]) {
      const styleName = `base-${style}`
      if (!index[styleName]) {
        index[styleName] = {}
      }
      index[styleName][item.name] = item
    }
  }

  // Add Hanzo-specific extensions to all styles
  const hanzoExtensions = [
    ...hanzoAiRegistry.items,
    ...hanzoFinanceRegistry.items,
    ...hanzo3DRegistry.items,
    ...hanzoAnimationRegistry.items,
    ...hanzoCodeRegistry.items,
  ]

  for (const item of hanzoExtensions) {
    for (const styleName of Object.keys(index)) {
      index[styleName][item.name] = item
    }
  }

  return index
}

// The registry index
export const Index = buildRegistryIndex()

// Get all registry items for a style
export function getRegistryItems(styleName: string): RegistryItem[] {
  const styleIndex = Index[styleName]
  if (!styleIndex) {
    return []
  }
  return Object.values(styleIndex)
}

// Get a specific registry item
export function getRegistryItem(
  name: string,
  styleName: string
): RegistryItem | null {
  return Index[styleName]?.[name] ?? null
}

// Get registry items by type
export function getRegistryItemsByType(
  type: RegistryItem["type"],
  styleName: string
): RegistryItem[] {
  return getRegistryItems(styleName).filter((item) => item.type === type)
}

// Get UI components
export function getUIComponents(styleName: string): RegistryItem[] {
  return getRegistryItemsByType("registry:ui", styleName)
}

// Get blocks
export function getBlocks(styleName: string): RegistryItem[] {
  return getRegistryItemsByType("registry:block", styleName)
}

// Get examples
export function getExamples(styleName: string): RegistryItem[] {
  return getRegistryItemsByType("registry:example", styleName)
}

// Get Hanzo AI components
export function getAIComponents(styleName: string): RegistryItem[] {
  return getRegistryItemsByType("registry:ai", styleName)
}

// Get Hanzo finance components
export function getFinanceComponents(styleName: string): RegistryItem[] {
  return getRegistryItemsByType("registry:finance", styleName)
}

// Get Hanzo 3D components
export function get3DComponents(styleName: string): RegistryItem[] {
  return getRegistryItemsByType("registry:3d", styleName)
}

// Get Hanzo animation components
export function getAnimationComponents(styleName: string): RegistryItem[] {
  return getRegistryItemsByType("registry:animation", styleName)
}

// Get the component for a registry item (for runtime rendering)
export function getRegistryComponent(
  name: string,
  styleName: string
): React.ComponentType<any> | null {
  const item = Index[styleName]?.[name]
  return item?.component ?? null
}

// Build the style name from base and style
export function buildStyleName(base: BaseName, style: StyleName): string {
  return `${base}-${style}`
}

// Get available styles for a base
export function getStylesForBase(base: BaseName): StyleName[] {
  return ["vega", "nova", "maia", "lyra", "mira", "hanzo"] as StyleName[]
}

// Full registry export
export const registry: Registry = {
  name: "hanzo/ui",
  homepage: "https://ui.hanzo.ai",
  items: [
    ...radixRegistry.items,
    ...baseRegistry.items,
    ...hanzoAiRegistry.items,
    ...hanzoFinanceRegistry.items,
    ...hanzo3DRegistry.items,
    ...hanzoAnimationRegistry.items,
    ...hanzoCodeRegistry.items,
  ],
}
