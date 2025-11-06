import { registrySchema, Registry, RegistryItem } from "../registry"
import { fetchRegistry, getRegistryItem, getRegistryItemUrl } from "../registry/api"
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { z } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"

// Get package version
let packageVersion = "4.5.0"
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const packageJson = require("../../package.json")
  packageVersion = packageJson.version || packageVersion
} catch (error) {
  console.error("Could not load package.json for version", error)
}

/**
 * MCP Server implementation for @hanzo/ui registry
 * Provides tools for interacting with the registry
 */
export const server = new Server(
  {
    name: "hanzo-ui",
    version: packageVersion,
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
)

// Register the available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "init",
        description:
          "Initialize a new project using @hanzo/ui components and styles.",
        inputSchema: zodToJsonSchema(z.object({
          style: z.string().optional().describe("The style to use for the project (e.g., 'default' or 'new-york')"),
        })),
      },
      {
        name: "list_components",
        description: "List all available components in the registry",
        inputSchema: zodToJsonSchema(z.object({
          type: z.string().optional().describe("Filter components by type (e.g., 'ui', 'block')"),
          category: z.string().optional().describe("Filter components by category"),
        })),
      },
      {
        name: "get_component",
        description: "Get detailed information about a specific component",
        inputSchema: zodToJsonSchema(
          z.object({
            name: z
              .string()
              .describe("The name of the component to get from the registry"),
          })
        ),
      },
      {
        name: "add_component",
        description: "Get instructions for adding a component to a project",
        inputSchema: zodToJsonSchema(
          z.object({
            name: z
              .string()
              .describe("The name of the component to add"),
            style: z
              .string()
              .optional()
              .describe("The style to use (default, new-york, etc.)"),
          })
        ),
      },
      {
        name: "list_styles",
        description: "List all available styles in the registry",
        inputSchema: zodToJsonSchema(z.object({})),
      },
      {
        name: "search_registry",
        description: "Search the registry for components matching criteria",
        inputSchema: zodToJsonSchema(
          z.object({
            query: z
              .string()
              .describe("Search term to look for in component names and descriptions"),
          })
        ),
      },
    ],
  }
})

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    // Ensure we have arguments
    const args = request.params.arguments || {}

    // Get registry URL from environment variable or use default
    const REGISTRY_URL = process.env.REGISTRY_URL || "https://ui.hanzo.ai/registry/registry.json"
    const registry = await getRegistry(REGISTRY_URL)

    switch (request.params.name) {
      case "init": {
        const style = args.style || "default"
        
        let text = `# Initialize a new project with @hanzo/ui

To create a new project with @hanzo/ui components, follow these steps:

1. Create a new project first:
\`\`\`bash
# Using npm
npm create next-app@latest my-app

# Or using yarn
yarn create next-app my-app

# Or using pnpm
pnpm create next-app my-app
\`\`\`

2. Navigate to your project directory:
\`\`\`bash
cd my-app
\`\`\`

3. Install @hanzo/ui and initialize it:
\`\`\`bash
npx @hanzo/ui@latest init${style ? ` --style=${style}` : ""}
\`\`\`

This will:
- Install all necessary dependencies
- Set up the project structure for @hanzo/ui
- Configure tailwind.css with the appropriate theme
- Add component configuration
`

        // Check if the registry has any additional setup instructions
        const setupConfig = registry.items.find(
          (item) => item.type === "registry:config" && item.name === "setup"
        )

        if (setupConfig) {
          text += `
## Additional Setup

${setupConfig.description || "Follow any additional setup instructions provided during initialization."}
`
        }

        return {
          content: [
            { type: "text", text }
          ],
        }
      }
      
      case "list_components": {
        // Filter components based on type and category if provided
        const typeFilter = args.type ? `ui:${args.type}` : null
        const categoryFilter = args.category || null
        
        let components = registry.items.filter(item => {
          // Filter by type if specified
          if (typeFilter && !item.type.includes(typeFilter)) {
            return false
          }
          
          // Filter by category if specified
          if (categoryFilter && item.category !== categoryFilter) {
            return false
          }
          
          return true
        })

        // Group components by category if they have categories
        const hasCategories = components.some(item => item.category)
        let responseText = "# Available Components\n\n"
        
        if (hasCategories) {
          // Group by category
          const categorized = components.reduce((acc, item) => {
            const category = item.category || "Uncategorized"
            if (!acc[category]) {
              acc[category] = []
            }
            acc[category].push(item)
            return acc
          }, {} as Record<string, RegistryItem[]>)
          
          // Build response
          for (const [category, items] of Object.entries(categorized)) {
            responseText += `## ${category}\n\n`
            
            items.forEach(item => {
              responseText += `- **${item.name}** - ${item.description || 'No description available'}\n`
            })
            
            responseText += "\n"
          }
        } else {
          // Simple list
          components.forEach(item => {
            responseText += `- **${item.name}** (${item.type}) - ${item.description || 'No description available'}\n`
          })
        }
        
        responseText += "\nTo get detailed information about a specific component, use the `get_component` tool.\n"
        responseText += "To add a component to your project, use the `add_component` tool.\n"
        
        return {
          content: [{ type: "text", text: responseText }],
        }
      }

      case "get_component": {
        const name = z.string().parse(args.name)

        if (!name) {
          throw new Error("Component name is required")
        }

        const itemUrl = getRegistryItemUrl(name, REGISTRY_URL)
        const component = await getRegistryItem(itemUrl, "")

        if (!component) {
          return {
            content: [
              {
                type: "text",
                text: `Component '${name}' not found in the registry.`,
              },
            ],
          }
        }

        // Build a markdown description of the component
        let componentDetails = `# ${component.name}\n\n`
        
        if (component.description) {
          componentDetails += `${component.description}\n\n`
        }
        
        componentDetails += `**Type:** ${component.type}\n`
        
        if (component.category) {
          componentDetails += `**Category:** ${component.category}\n`
        }
        
        // Dependencies
        if (component.dependencies && component.dependencies.length > 0) {
          componentDetails += `\n## Dependencies\n\n`
          component.dependencies.forEach(dep => {
            componentDetails += `- ${dep}\n`
          })
        }
        
        // Registry Dependencies
        if (component.registryDependencies && component.registryDependencies.length > 0) {
          componentDetails += `\n## Required Components\n\n`
          componentDetails += `This component requires the following components that will be installed automatically:\n\n`
          component.registryDependencies.forEach(dep => {
            componentDetails += `- ${dep}\n`
          })
        }
        
        // Files
        if (component.files && component.files.length > 0) {
          componentDetails += `\n## Files\n\n`
          component.files.forEach(file => {
            componentDetails += `- ${file.path} (${file.type})\n`
          })
        }
        
        // Show example usage if available
        const exampleFile = component.files?.find(file => file.type === "registry:example")
        if (exampleFile && exampleFile.content) {
          componentDetails += `\n## Example Usage\n\n\`\`\`tsx\n${exampleFile.content}\n\`\`\`\n`
        }
        
        // Add installation instructions
        componentDetails += `\n## Installation\n\n`
        componentDetails += `Run the following command to add this component to your project:\n\n`
        componentDetails += `\`\`\`bash\n`
        componentDetails += `npx @hanzo/ui@latest add ${name}\n`
        componentDetails += `\`\`\`\n`

        return {
          content: [{ type: "text", text: componentDetails }],
        }
      }

      case "add_component": {
        const name = z.string().parse(args.name)
        const style = args.style || "default"

        if (!name) {
          throw new Error("Component name is required")
        }

        const itemUrl = getRegistryItemUrl(name, REGISTRY_URL)
        const component = await getRegistryItem(itemUrl, "")

        if (!component) {
          return {
            content: [
              {
                type: "text",
                text: `Component '${name}' not found in the registry.`,
              },
            ],
          }
        }
        
        // Check if the component has dependencies
        const hasDeps = component.registryDependencies && component.registryDependencies.length > 0
        
        let instructions = `# Adding the ${name} Component\n\n`
        
        // Main installation command
        instructions += `Run the following command to add the \`${name}\` component to your project:\n\n`
        instructions += `\`\`\`bash\n`
        instructions += `npx @hanzo/ui@latest add ${name} --style=${style}\n`
        instructions += `\`\`\`\n\n`
        
        // Explain what this will do
        instructions += `This will:\n`
        instructions += `- Add the component file(s) to your project\n`
        instructions += `- Install any required npm dependencies\n`
        
        if (hasDeps) {
          instructions += `- Install required component dependencies: ${component.registryDependencies!.join(", ")}\n`
        }
        
        // Usage example
        instructions += `\n## Usage\n\nAfter adding the component, you can import it in your project:\n\n`
        instructions += `\`\`\`tsx\n`
        instructions += `import { ${name.charAt(0).toUpperCase() + name.slice(1)} } from "@/components/ui/${name}"\n\n`
        
        // Add a simple example if possible
        if (component.type.includes("ui:")) {
          instructions += `export default function Example() {\n`
          instructions += `  return <${name.charAt(0).toUpperCase() + name.slice(1)} />\n`
          instructions += `}\n`
        }
        
        instructions += `\`\`\`\n`

        return {
          content: [
            {
              type: "text",
              text: instructions,
            },
          ],
        }
      }
      
      case "list_styles": {
        // Find all style-related items in the registry
        const styles = registry.items.filter(item => 
          item.type === "registry:style" || item.type.includes("style")
        )
        
        let styleInfo = "# Available Styles\n\n"
        
        if (styles.length === 0) {
          styleInfo += "The registry does not define any specific styles.\n\n"
          styleInfo += "The default style will be used when installing components.\n"
        } else {
          styles.forEach(style => {
            styleInfo += `## ${style.name}\n\n`
            styleInfo += `${style.description || 'No description available'}\n\n`
            
            // Add usage info
            styleInfo += `**Usage:**\n\n`
            styleInfo += `\`\`\`bash\n`
            styleInfo += `# Initialize with this style\n`
            styleInfo += `npx @hanzo/ui@latest init --style=${style.name}\n\n`
            styleInfo += `# Install components with this style\n`
            styleInfo += `npx @hanzo/ui@latest add [component] --style=${style.name}\n`
            styleInfo += `\`\`\`\n\n`
          })
        }
        
        return {
          content: [{ type: "text", text: styleInfo }],
        }
      }
      
      case "search_registry": {
        const query = z.string().parse(args.query).toLowerCase()
        
        if (!query || query.length < 2) {
          return {
            content: [
              {
                type: "text",
                text: "Please provide a search term with at least 2 characters.",
              },
            ],
          }
        }
        
        // Search through all items in the registry
        const results = registry.items.filter(item => {
          // Search in name
          if (item.name.toLowerCase().includes(query)) {
            return true
          }
          
          // Search in description
          if (item.description?.toLowerCase().includes(query)) {
            return true
          }
          
          // Search in category
          if (item.category?.toLowerCase().includes(query)) {
            return true
          }
          
          return false
        })
        
        if (results.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No components found matching '${query}'. Try a different search term.`,
              },
            ],
          }
        }
        
        // Format the results
        let searchResults = `# Search Results for '${query}'\n\n`
        searchResults += `Found ${results.length} matching components\n\n`
        
        results.forEach(item => {
          searchResults += `## ${item.name}\n\n`
          searchResults += `**Type:** ${item.type}\n`
          
          if (item.category) {
            searchResults += `**Category:** ${item.category}\n`
          }
          
          if (item.description) {
            searchResults += `\n${item.description}\n`
          }
          
          searchResults += `\n**Installation:**\n\n`
          searchResults += `\`\`\`bash\nnpx @hanzo/ui@latest add ${item.name}\n\`\`\`\n\n`
        })
        
        return {
          content: [{ type: "text", text: searchResults }],
        }
      }
      
      default:
        throw new Error(`Tool ${request.params.name} not found`)
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        content: [
          {
            type: "text",
            text: `Invalid input: ${JSON.stringify(error.issues || error)}`,
          },
        ],
      }
    }

    throw error
  }
})

/**
 * Fetches and parses the registry from the given URL
 * @param registryUrl - URL to the registry.json file
 * @returns The parsed registry object
 */
async function getRegistry(registryUrl: string): Promise<Registry> {
  try {
    const [registryJson] = await fetchRegistry([registryUrl], {
      useCache: false,
    })
    return registrySchema.parse(registryJson)
  } catch (error) {
    console.error(`Failed to fetch registry from ${registryUrl}:`, error)
    // Return a minimal valid registry if we can't fetch the real one
    return {
      name: "hanzo-ui",
      items: [],
    }
  }
}

// Support CommonJS
if (typeof module !== 'undefined') {
  module.exports = { server }
}
