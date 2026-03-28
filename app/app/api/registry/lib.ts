/**
 * Shared registry data loader for API routes.
 *
 * Reads from the built registry JSON files in public/registry/.
 * These are generated at build time by scripts/build-registry.mts.
 */

import { readFileSync, readdirSync, existsSync } from "fs"
import path from "path"

const REGISTRY_DIR = path.join(process.cwd(), "public/registry")
const STYLES_DIR = path.join(REGISTRY_DIR, "styles/default")

export interface RegistryItem {
  name: string
  type: string
  dependencies?: string[]
  devDependencies?: string[]
  registryDependencies?: string[]
  files: Array<{ name: string; content: string } | string>
  description?: string
  category?: string
}

// In-memory cache (populated on first access, lives for the server lifetime)
let _index: RegistryItem[] | null = null
let _components: Map<string, RegistryItem> | null = null

function loadIndex(): RegistryItem[] {
  if (_index) return _index
  const indexPath = path.join(REGISTRY_DIR, "index.json")
  if (!existsSync(indexPath)) return []
  _index = JSON.parse(readFileSync(indexPath, "utf-8")) as RegistryItem[]
  return _index
}

function loadComponents(): Map<string, RegistryItem> {
  if (_components) return _components
  _components = new Map()

  if (!existsSync(STYLES_DIR)) return _components

  const files = readdirSync(STYLES_DIR).filter((f) => f.endsWith(".json"))
  for (const file of files) {
    try {
      const data = JSON.parse(
        readFileSync(path.join(STYLES_DIR, file), "utf-8")
      ) as RegistryItem
      _components.set(data.name, data)
    } catch {
      // skip malformed files
    }
  }
  return _components
}

/** Get the full component index (names, types, deps — no source). */
export function getIndex(): RegistryItem[] {
  return loadIndex()
}

/** Get all components with full source code. */
export function getComponentMap(): Map<string, RegistryItem> {
  return loadComponents()
}

/** Get a single component by name (with source). */
export function getComponent(name: string): RegistryItem | undefined {
  const map = loadComponents()
  // Try exact match first
  let item = map.get(name)
  if (item) return item

  // Try with -demo suffix stripped
  item = map.get(`${name}-demo`)
  return item
}

/** Search components by name/type. */
export function searchComponents(query: string): RegistryItem[] {
  const q = query.toLowerCase()
  const index = loadIndex()
  return index.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.type?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q)
  )
}

/** List components filtered by type. */
export function listByType(type?: string): RegistryItem[] {
  const index = loadIndex()
  if (!type) return index
  return index.filter((item) => item.type === type || item.type?.includes(type))
}

/** Get full registry manifest (all components with source — single payload). */
export function getFullManifest() {
  const map = loadComponents()
  const components: Record<string, any> = {}
  for (const [name, item] of map) {
    components[name] = item
  }
  return {
    generated_at: Date.now(),
    total: map.size,
    components,
  }
}

/** Invalidate the in-memory cache (call after registry:build). */
export function invalidateCache() {
  _index = null
  _components = null
}
