/**
 * Build static API responses from the registry data.
 *
 * Generates /public/api/registry/ files that work on CF Pages,
 * GitHub Pages, or any static hosting. Run after build-registry.mts.
 *
 * Output:
 *   public/api/registry/index.json         — full manifest (all components + source)
 *   public/api/registry/components.json     — component list (no source)
 *   public/api/registry/components/{name}.json — individual component with source
 *   public/api/registry/search-index.json   — lightweight search index
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs"
import path from "path"

const REGISTRY_DIR = path.join(process.cwd(), "public/registry")
const STYLES_DIR = path.join(REGISTRY_DIR, "styles/default")
const API_DIR = path.join(process.cwd(), "public/api/registry")
const COMPONENTS_DIR = path.join(API_DIR, "components")

interface RegistryItem {
  name: string
  type: string
  dependencies?: string[]
  devDependencies?: string[]
  registryDependencies?: string[]
  files: Array<{ name: string; content: string } | string>
  description?: string
  category?: string
}

function main() {
  console.log("Building static registry API files...")

  // Read the index
  const indexPath = path.join(REGISTRY_DIR, "index.json")
  if (!existsSync(indexPath)) {
    console.error("Registry index.json not found. Run registry:build first.")
    process.exit(1)
  }

  const index: RegistryItem[] = JSON.parse(readFileSync(indexPath, "utf-8"))

  // Read all component files
  const components = new Map<string, RegistryItem>()
  if (existsSync(STYLES_DIR)) {
    const files = readdirSync(STYLES_DIR).filter((f) => f.endsWith(".json"))
    for (const file of files) {
      try {
        const data: RegistryItem = JSON.parse(
          readFileSync(path.join(STYLES_DIR, file), "utf-8")
        )
        components.set(data.name, data)
      } catch {
        // skip
      }
    }
  }

  // Create output directories
  mkdirSync(COMPONENTS_DIR, { recursive: true })

  // 1. Component list (no source — lightweight)
  const componentList = index.map((item) => ({
    name: item.name,
    type: item.type,
    dependencies: item.dependencies,
    registryDependencies: item.registryDependencies,
  }))

  writeFileSync(
    path.join(API_DIR, "components.json"),
    JSON.stringify({ total: componentList.length, components: componentList })
  )
  console.log(`  components.json: ${componentList.length} components`)

  // 2. Individual component files (with source)
  let written = 0
  for (const [name, data] of components) {
    writeFileSync(
      path.join(COMPONENTS_DIR, `${name}.json`),
      JSON.stringify(data)
    )
    written++
  }
  console.log(`  components/*.json: ${written} files`)

  // 3. Full manifest (single payload with all source)
  const manifest: Record<string, any> = {}
  for (const [name, data] of components) {
    manifest[name] = data
  }
  writeFileSync(
    path.join(API_DIR, "index.json"),
    JSON.stringify({
      generated_at: Date.now(),
      total: components.size,
      components: manifest,
    })
  )
  console.log(`  index.json: full manifest`)

  // 4. Search index (lightweight — names + types for client-side search)
  const searchIndex = index.map((item) => ({
    n: item.name,
    t: item.type,
    d: (item.dependencies || []).join(","),
  }))
  writeFileSync(
    path.join(API_DIR, "search-index.json"),
    JSON.stringify(searchIndex)
  )
  console.log(`  search-index.json: ${searchIndex.length} entries`)

  console.log("Done! Static API files written to public/api/registry/")
}

main()
