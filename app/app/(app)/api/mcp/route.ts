import { NextResponse } from "next/server"
import { registry } from "@/registry/registry"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get("name")

  // Handle MCP server info request
  if (!name) {
    return NextResponse.json({
      name: "hanzo-ui-mcp",
      version: "1.0.0",
      description: "MCP server for hanzo/ui components registry",
      capabilities: {
        tools: [
          {
            name: "list_components",
            description: "List all available components in the hanzo/ui registry",
            inputSchema: {
              type: "object",
              properties: {
                category: {
                  type: "string",
                  description: "Filter by category (ui, ai, 3d, animation, code, extended, blocks)",
                  enum: ["ui", "ai", "3d", "animation", "code", "extended", "blocks", "all"]
                }
              }
            }
          },
          {
            name: "search_components",
            description: "Search for components by name or description",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query"
                }
              },
              required: ["query"]
            }
          },
          {
            name: "get_component",
            description: "Get details and code for a specific component",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Component name"
                },
                includeCode: {
                  type: "boolean",
                  description: "Include component source code",
                  default: false
                }
              },
              required: ["name"]
            }
          },
          {
            name: "get_component_dependencies",
            description: "Get all dependencies for a component including registry dependencies",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Component name"
                }
              },
              required: ["name"]
            }
          },
          {
            name: "install_component",
            description: "Generate installation instructions for a component",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Component name"
                },
                importStyle: {
                  type: "string",
                  description: "Import style: 'package' for @hanzo/ui or 'relative' for @/components",
                  enum: ["package", "relative"],
                  default: "relative"
                }
              },
              required: ["name"]
            }
          }
        ],
        prompts: [
          {
            name: "browse_ai_components",
            description: "Browse all AI components in the hanzo/ui registry"
          },
          {
            name: "browse_3d_components",
            description: "Browse all 3D components with three.js integration"
          },
          {
            name: "browse_animation_components",
            description: "Browse all animation components with framer-motion"
          },
          {
            name: "browse_code_components",
            description: "Browse all code-related components (editors, blocks, terminals)"
          },
          {
            name: "create_landing_page",
            description: "Create a landing page using hanzo/ui blocks and components"
          },
          {
            name: "setup_project",
            description: "Set up a new project with hanzo/ui components"
          }
        ]
      }
    })
  }

  // Handle component request
  const component = registry.find(c => c.name === name)

  if (!component) {
    return NextResponse.json(
      { error: `Component '${name}' not found` },
      { status: 404 }
    )
  }

  // Transform component for registry format
  const registryItem = {
    name: component.name,
    type: component.type || "components:ui",
    registryDependencies: component.registryDependencies || [],
    dependencies: component.dependencies || [],
    devDependencies: component.devDependencies || {},
    tailwind: component.tailwind || {},
    cssVars: component.cssVars || {},
    files: component.files || [],
    description: component.description || "",
    source: `https://ui.hanzo.ai/r/${component.name}`,
    category: getCategory(component.type)
  }

  return NextResponse.json(registryItem)
}

function getCategory(type: string | undefined): string {
  if (!type) return "ui"
  if (type.includes("ai")) return "ai"
  if (type.includes("3d")) return "3d"
  if (type.includes("animation")) return "animation"
  if (type.includes("code")) return "code"
  if (type.includes("block")) return "blocks"
  if (type.includes("extended")) return "extended"
  return "ui"
}

// Handle MCP tool calls
export async function POST(request: Request) {
  const body = await request.json()
  const { tool, params } = body

  switch (tool) {
    case "list_components": {
      const category = params?.category || "all"
      const components = category === "all"
        ? registry
        : registry.filter(c => getCategory(c.type) === category)

      return NextResponse.json({
        components: components.map(c => ({
          name: c.name,
          description: c.description,
          category: getCategory(c.type)
        }))
      })
    }

    case "search_components": {
      const query = params.query.toLowerCase()
      const results = registry.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      )

      return NextResponse.json({
        results: results.map(c => ({
          name: c.name,
          description: c.description,
          category: getCategory(c.type)
        }))
      })
    }

    case "get_component": {
      const component = registry.find(c => c.name === params.name)
      if (!component) {
        return NextResponse.json(
          { error: `Component '${params.name}' not found` },
          { status: 404 }
        )
      }

      const result: any = {
        name: component.name,
        description: component.description,
        dependencies: component.dependencies || [],
        registryDependencies: component.registryDependencies || [],
        files: component.files || [],
        category: getCategory(component.type),
        type: component.type,
        tailwind: component.tailwind,
        cssVars: component.cssVars
      }

      if (params.includeCode) {
        // Note: In a real implementation, you would read the actual file content
        result.code = `// Component code for ${component.name} would be loaded from ${component.files?.[0] || 'file'}`
      }

      return NextResponse.json(result)
    }

    case "get_component_dependencies": {
      const component = registry.find(c => c.name === params.name)
      if (!component) {
        return NextResponse.json(
          { error: `Component '${params.name}' not found` },
          { status: 404 }
        )
      }

      const allDeps = new Set<string>()
      const collectDeps = (compName: string, visited = new Set<string>()) => {
        if (visited.has(compName)) return
        visited.add(compName)

        const comp = registry.find(c => c.name === compName)
        if (!comp) return

        comp.dependencies?.forEach(dep => allDeps.add(dep))
        comp.registryDependencies?.forEach(dep => {
          allDeps.add(`@hanzo/ui/${dep}`)
          collectDeps(dep, visited)
        })
      }

      collectDeps(params.name)

      return NextResponse.json({
        name: component.name,
        dependencies: component.dependencies || [],
        registryDependencies: component.registryDependencies || [],
        allDependencies: Array.from(allDeps).sort(),
        installCommand: `npm install ${Array.from(allDeps).filter(dep => !dep.startsWith('@hanzo')).join(' ')}`
      })
    }

    case "install_component": {
      const component = registry.find(c => c.name === params.name)
      if (!component) {
        return NextResponse.json(
          { error: `Component '${params.name}' not found` },
          { status: 404 }
        )
      }

      const importStyle = params.importStyle || "relative"
      const importPath = importStyle === "package"
        ? `@hanzo/ui`
        : `@/components/ui`

      return NextResponse.json({
        name: component.name,
        cli: `npx hanzo-ui@latest add ${component.name}`,
        npm: `npm install @hanzo/ui`,
        import: `import { ${toPascalCase(component.name)} } from "${importPath}/${component.name}"`,
        usage: generateUsageExample(component.name),
        dependencies: component.dependencies || [],
        description: component.description
      })
    }

    default:
      return NextResponse.json(
        { error: `Unknown tool: ${tool}` },
        { status: 400 }
      )
  }
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

function generateUsageExample(name: string): string {
  const componentName = toPascalCase(name)
  return `<${componentName} />`
}