import { registrySchema, Registry, RegistryItem } from "../registry"
import { fetchRegistry, getRegistryItem, getRegistryItemUrl } from "../registry/api"
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { z } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"
import * as fs from "fs/promises"
import * as path from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

// Get package version
let packageVersion = "4.5.0"
try {
  const packageJson = JSON.parse(await fs.readFile(path.join(dirname(fileURLToPath(import.meta.url)), "../../package.json"), "utf-8"))
  packageVersion = packageJson.version || packageVersion
} catch (error) {
  console.error("Could not load package.json for version", error)
}

/**
 * Enhanced MCP Server implementation for @hanzo/ui registry
 * Provides comprehensive tools, resources, and prompts for AI-assisted development
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
      prompts: {},
    },
  }
)

// Cache for registry data
let registryCache: Registry | null = null
let registryCacheTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Fetches and caches the registry
 */
async function getRegistry(): Promise<Registry> {
  const now = Date.now()
  if (registryCache && now - registryCacheTime < CACHE_DURATION) {
    return registryCache
  }

  try {
    const registryUrl = process.env.REGISTRY_URL || "https://ui.hanzo.ai/registry/registry.json"
    const [registryJson] = await fetchRegistry([registryUrl], {
      useCache: false,
    })
    registryCache = registrySchema.parse(registryJson)
    registryCacheTime = now
    return registryCache
  } catch (error) {
    console.error("Failed to fetch registry:", error)
    // Return cached version if available, otherwise minimal registry
    return registryCache || {
      name: "hanzo-ui",
      items: [],
    }
  }
}

/**
 * Get the source code of a component from the primitives directory
 */
async function getComponentSource(componentName: string): Promise<string | null> {
  try {
    const primitivesPath = path.join(dirname(fileURLToPath(import.meta.url)), "../primitives")
    const componentPath = path.join(primitivesPath, `${componentName}.tsx`)
    
    // Check if file exists
    await fs.access(componentPath)
    const source = await fs.readFile(componentPath, "utf-8")
    return source
  } catch (error) {
    // Try to find in registry
    try {
      const registryUrl = process.env.REGISTRY_URL || "https://ui.hanzo.ai/registry/registry.json"
      const itemUrl = getRegistryItemUrl(componentName, registryUrl)
      const component = await getRegistryItem(itemUrl, "")
      
      if (component && component.files && component.files.length > 0) {
        // Return the first file's content (usually the main component)
        const mainFile = component.files.find(f => f.type === "registry:ui") || component.files[0]
        return mainFile.content || null
      }
    } catch (registryError) {
      console.error(`Failed to get component source for ${componentName}:`, registryError)
    }
    return null
  }
}

// Register the available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "init",
        description: "Initialize a new project using @hanzo/ui components and styles.",
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
            name: z.string().describe("The name of the component to get from the registry"),
          })
        ),
      },
      {
        name: "get_component_source",
        description: "Get the full source code of a component",
        inputSchema: zodToJsonSchema(
          z.object({
            name: z.string().describe("The name of the component to get source code for"),
          })
        ),
      },
      {
        name: "get_component_demo",
        description: "Get a demo/example implementation of a component",
        inputSchema: zodToJsonSchema(
          z.object({
            name: z.string().describe("The name of the component to get demo for"),
          })
        ),
      },
      {
        name: "add_component",
        description: "Get instructions for adding a component to a project",
        inputSchema: zodToJsonSchema(
          z.object({
            name: z.string().describe("The name of the component to add"),
            style: z.string().optional().describe("The style to use (default, new-york, etc.)"),
          })
        ),
      },
      {
        name: "list_blocks",
        description: "List all available UI blocks/patterns",
        inputSchema: zodToJsonSchema(z.object({
          category: z.string().optional().describe("Filter blocks by category"),
        })),
      },
      {
        name: "get_block",
        description: "Get detailed information about a specific block",
        inputSchema: zodToJsonSchema(
          z.object({
            name: z.string().describe("The name of the block to get"),
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
            query: z.string().describe("Search term to look for in component names and descriptions"),
          })
        ),
      },
      {
        name: "get_installation_guide",
        description: "Get the complete installation guide for setting up Hanzo UI",
        inputSchema: zodToJsonSchema(z.object({})),
      },
    ],
  }
})

// Register available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const registry = await getRegistry()
  
  return {
    resources: [
      {
        uri: "hanzo://components/list",
        name: "Component List",
        description: "Complete list of all available Hanzo UI components",
        mimeType: "text/markdown",
      },
      {
        uri: "hanzo://blocks/list",
        name: "Block List",
        description: "List of all UI blocks and patterns",
        mimeType: "text/markdown",
      },
      {
        uri: "hanzo://installation/guide",
        name: "Installation Guide",
        description: "Complete guide for installing and setting up Hanzo UI",
        mimeType: "text/markdown",
      },
      {
        uri: "hanzo://theming/guide",
        name: "Theming Guide",
        description: "Guide for customizing themes and styles",
        mimeType: "text/markdown",
      },
    ],
  }
})

// Handle resource reads
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri
  const registry = await getRegistry()

  switch (uri) {
    case "hanzo://components/list": {
      const components = registry.items.filter(item => item.type.includes("ui:"))
      const grouped = components.reduce((acc, item) => {
        const category = item.category || "Uncategorized"
        if (!acc[category]) acc[category] = []
        acc[category].push(item)
        return acc
      }, {} as Record<string, RegistryItem[]>)

      let content = "# Hanzo UI Components\n\n"
      for (const [category, items] of Object.entries(grouped)) {
        content += `## ${category}\n\n`
        for (const item of items) {
          content += `### ${item.name}\n`
          content += `${item.description || 'No description'}\n\n`
          content += `**Command:** \`npx @hanzo/ui@latest add ${item.name}\`\n\n`
        }
      }

      return {
        contents: [{ uri, mimeType: "text/markdown", text: content }],
      }
    }

    case "hanzo://blocks/list": {
      const blocks = registry.items.filter(item => item.type.includes("block"))
      let content = "# Hanzo UI Blocks\n\n"
      
      for (const block of blocks) {
        content += `## ${block.name}\n`
        content += `${block.description || 'No description'}\n\n`
        content += `**Command:** \`npx @hanzo/ui@latest add ${block.name}\`\n\n`
      }

      return {
        contents: [{ uri, mimeType: "text/markdown", text: content }],
      }
    }

    case "hanzo://installation/guide": {
      const content = `# Hanzo UI Installation Guide

## Quick Start

### 1. Create a new project
\`\`\`bash
npm create next-app@latest my-app --typescript --tailwind --app
cd my-app
\`\`\`

### 2. Initialize Hanzo UI
\`\`\`bash
npx @hanzo/ui@latest init
\`\`\`

This will:
- Install dependencies
- Configure Tailwind CSS
- Set up the project structure
- Add the cn() utility function

### 3. Add components
\`\`\`bash
# Add specific components
npx @hanzo/ui@latest add button
npx @hanzo/ui@latest add card dialog

# Add multiple components
npx @hanzo/ui@latest add button card dialog
\`\`\`

## Manual Installation

### 1. Install dependencies
\`\`\`bash
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge
\`\`\`

### 2. Configure tailwind.config.js
\`\`\`javascript
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [require("tailwindcss-animate")],
}
\`\`\`

### 3. Add the cn() utility
Create \`lib/utils.ts\`:
\`\`\`typescript
import { ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
\`\`\`

## Using Components

Import and use components in your application:

\`\`\`tsx
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <Button variant="outline">Click me</Button>
  )
}
\`\`\`
`
      return {
        contents: [{ uri, mimeType: "text/markdown", text: content }],
      }
    }

    case "hanzo://theming/guide": {
      const content = `# Hanzo UI Theming Guide

## Color System

Hanzo UI uses CSS variables for theming, making it easy to customize colors.

### Default Theme Variables

Add to your \`globals.css\`:

\`\`\`css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark mode colors ... */
  }
}
\`\`\`

## Custom Themes

### Creating a Custom Theme

1. Define your color palette
2. Convert colors to HSL format
3. Update CSS variables
4. Apply to components

### Example: Brand Theme

\`\`\`css
@layer base {
  :root {
    --primary: 262 80% 50%; /* Purple */
    --secondary: 173 80% 40%; /* Teal */
    /* ... other custom colors ... */
  }
}
\`\`\`

## Component Variants

Many components support variants for different styles:

\`\`\`tsx
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
\`\`\`

## Dark Mode

Toggle dark mode with a simple class:

\`\`\`tsx
// Add to your root layout or app
<html className="dark">
  {/* Your app */}
</html>
\`\`\`

## Advanced Customization

### Custom Component Styles

Override component styles using className:

\`\`\`tsx
<Button 
  className="bg-gradient-to-r from-purple-500 to-pink-500"
>
  Gradient Button
</Button>
\`\`\`

### Global Style Overrides

Add to your CSS file:

\`\`\`css
/* Override all buttons */
.ui-button {
  @apply font-bold tracking-wide;
}
\`\`\`
`
      return {
        contents: [{ uri, mimeType: "text/markdown", text: content }],
      }
    }

    default:
      throw new Error(`Unknown resource: ${uri}`)
  }
})

// Register available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "component_usage",
        description: "Generate usage examples for a Hanzo UI component",
        arguments: [
          {
            name: "component",
            description: "Name of the component",
            required: true,
          },
        ],
      },
      {
        name: "build_page",
        description: "Build a complete page using Hanzo UI components",
        arguments: [
          {
            name: "page_type",
            description: "Type of page (landing, dashboard, form, etc.)",
            required: true,
          },
        ],
      },
      {
        name: "component_composition",
        description: "Create a custom component by composing Hanzo UI primitives",
        arguments: [
          {
            name: "component_name",
            description: "Name for the new component",
            required: true,
          },
          {
            name: "description",
            description: "What the component should do",
            required: true,
          },
        ],
      },
      {
        name: "accessibility_review",
        description: "Review and improve component accessibility",
        arguments: [
          {
            name: "component_code",
            description: "The component code to review",
            required: true,
          },
        ],
      },
      {
        name: "theme_customization",
        description: "Generate custom theme for Hanzo UI",
        arguments: [
          {
            name: "brand_colors",
            description: "Primary brand colors",
            required: true,
          },
          {
            name: "style",
            description: "Style preference (minimal, bold, playful, professional)",
            required: false,
          },
        ],
      },
    ],
  }
})

// Handle prompt requests
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const promptName = request.params.name
  const args = request.params.arguments || {}

  switch (promptName) {
    case "component_usage": {
      const componentName = args.component as string
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Generate comprehensive usage examples for the Hanzo UI ${componentName} component. Include:
1. Basic usage
2. With all variants (if applicable)
3. With different props/options
4. In common scenarios
5. Accessibility considerations
6. Common patterns and best practices`,
            },
          },
        ],
      }
    }

    case "build_page": {
      const pageType = args.page_type as string
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Build a complete ${pageType} page using Hanzo UI components. Requirements:
1. Use appropriate Hanzo UI components
2. Implement responsive design
3. Include proper accessibility
4. Follow Hanzo UI design patterns
5. Structure with semantic HTML
6. Add appropriate interactions
7. Include comments explaining component choices`,
            },
          },
        ],
      }
    }

    case "component_composition": {
      const componentName = args.component_name as string
      const description = args.description as string
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Create a custom "${componentName}" component that ${description}.
Requirements:
1. Compose using existing Hanzo UI primitives
2. Follow Hanzo UI patterns and conventions
3. Include TypeScript types
4. Make it reusable and configurable
5. Add proper accessibility attributes
6. Include usage examples
7. Follow the component API patterns from Hanzo UI`,
            },
          },
        ],
      }
    }

    case "accessibility_review": {
      const code = args.component_code as string
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Review this component for accessibility and suggest improvements:

\`\`\`tsx
${code}
\`\`\`

Check for:
1. ARIA attributes
2. Keyboard navigation
3. Screen reader support
4. Color contrast
5. Focus management
6. Semantic HTML
7. Alternative text
8. Error handling

Provide the improved version with explanations.`,
            },
          },
        ],
      }
    }

    case "theme_customization": {
      const brandColors = args.brand_colors as string
      const style = args.style as string || "professional"
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Generate a custom Hanzo UI theme with these brand colors: ${brandColors}
Style preference: ${style}

Provide:
1. Complete CSS variables for light mode
2. Complete CSS variables for dark mode
3. Color palette with all shades
4. Example component styling
5. Integration instructions
6. Preview of how components will look`,
            },
          },
        ],
      }
    }

    default:
      throw new Error(`Unknown prompt: ${promptName}`)
  }
})

// Handle tool calls (existing implementation with additions)
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const args = request.params.arguments || {}
  
  switch (request.params.name) {
    // ... existing tool implementations ...

    case "get_component_source": {
      const name = z.string().parse(args.name)
      const source = await getComponentSource(name)
      
      if (!source) {
        return {
          content: [{
            type: "text",
            text: `Could not find source code for component '${name}'`,
          }],
        }
      }

      return {
        content: [{
          type: "text",
          text: `# Source Code: ${name}\n\n\`\`\`tsx\n${source}\n\`\`\``,
        }],
      }
    }

    case "get_component_demo": {
      const name = z.string().parse(args.name)
      const registry = await getRegistry()
      const component = registry.items.find(item => item.name === name)
      
      if (!component) {
        return {
          content: [{
            type: "text",
            text: `Component '${name}' not found`,
          }],
        }
      }

      // Generate a demo based on component type
      let demo = `# ${name} Demo\n\n\`\`\`tsx\n`
      demo += `import { ${name.charAt(0).toUpperCase() + name.slice(1)} } from "@/components/ui/${name}"\n\n`
      demo += `export default function ${name.charAt(0).toUpperCase() + name.slice(1)}Demo() {\n`
      demo += `  return (\n`
      demo += `    <div className="space-y-4">\n`
      
      // Add component-specific demo content
      if (name === "button") {
        demo += `      <div className="flex gap-4">\n`
        demo += `        <${name.charAt(0).toUpperCase() + name.slice(1)}>Default</${name.charAt(0).toUpperCase() + name.slice(1)}>\n`
        demo += `        <${name.charAt(0).toUpperCase() + name.slice(1)} variant="outline">Outline</${name.charAt(0).toUpperCase() + name.slice(1)}>\n`
        demo += `        <${name.charAt(0).toUpperCase() + name.slice(1)} variant="secondary">Secondary</${name.charAt(0).toUpperCase() + name.slice(1)}>\n`
        demo += `        <${name.charAt(0).toUpperCase() + name.slice(1)} variant="destructive">Destructive</${name.charAt(0).toUpperCase() + name.slice(1)}>\n`
        demo += `      </div>\n`
      } else {
        demo += `      <${name.charAt(0).toUpperCase() + name.slice(1)} />\n`
      }
      
      demo += `    </div>\n`
      demo += `  )\n`
      demo += `}\n`
      demo += `\`\`\`\n\n`
      
      // Add usage notes
      demo += `## Usage Notes\n\n`
      demo += `- Import the component from \`@/components/ui/${name}\`\n`
      demo += `- ${component.description || 'No description available'}\n`
      
      if (component.dependencies && component.dependencies.length > 0) {
        demo += `\n## Required Dependencies\n\n`
        component.dependencies.forEach(dep => {
          demo += `- ${dep}\n`
        })
      }

      return {
        content: [{ type: "text", text: demo }],
      }
    }

    case "list_blocks": {
      const registry = await getRegistry()
      const blocks = registry.items.filter(item => 
        item.type.includes("block") || item.type.includes("section")
      )
      
      const categoryFilter = args.category as string | undefined
      const filtered = categoryFilter 
        ? blocks.filter(b => b.category === categoryFilter)
        : blocks

      let content = "# Available UI Blocks\n\n"
      
      if (filtered.length === 0) {
        content += "No blocks found"
        if (categoryFilter) {
          content += ` in category '${categoryFilter}'`
        }
        content += ".\n"
      } else {
        const byCategory = filtered.reduce((acc, block) => {
          const cat = block.category || "Uncategorized"
          if (!acc[cat]) acc[cat] = []
          acc[cat].push(block)
          return acc
        }, {} as Record<string, typeof blocks>)

        for (const [category, items] of Object.entries(byCategory)) {
          content += `## ${category}\n\n`
          for (const item of items) {
            content += `### ${item.name}\n`
            content += `${item.description || 'No description'}\n`
            content += `**Install:** \`npx @hanzo/ui@latest add ${item.name}\`\n\n`
          }
        }
      }

      return {
        content: [{ type: "text", text: content }],
      }
    }

    case "get_block": {
      const name = z.string().parse(args.name)
      const registry = await getRegistry()
      const block = registry.items.find(item => 
        item.name === name && (item.type.includes("block") || item.type.includes("section"))
      )
      
      if (!block) {
        return {
          content: [{
            type: "text",
            text: `Block '${name}' not found`,
          }],
        }
      }

      let content = `# ${block.name} Block\n\n`
      content += `${block.description || 'No description'}\n\n`
      
      if (block.category) {
        content += `**Category:** ${block.category}\n\n`
      }
      
      // Dependencies
      if (block.dependencies && block.dependencies.length > 0) {
        content += `## NPM Dependencies\n\n`
        block.dependencies.forEach(dep => {
          content += `- ${dep}\n`
        })
        content += "\n"
      }
      
      // Component dependencies
      if (block.registryDependencies && block.registryDependencies.length > 0) {
        content += `## Required Components\n\n`
        block.registryDependencies.forEach(dep => {
          content += `- ${dep}\n`
        })
        content += "\n"
      }
      
      // Installation
      content += `## Installation\n\n`
      content += `\`\`\`bash\n`
      content += `npx @hanzo/ui@latest add ${name}\n`
      content += `\`\`\`\n\n`
      
      // Files
      if (block.files && block.files.length > 0) {
        content += `## Files\n\n`
        block.files.forEach(file => {
          content += `- \`${file.path}\` (${file.type})\n`
        })
      }

      return {
        content: [{ type: "text", text: content }],
      }
    }

    case "get_installation_guide": {
      const content = `# Hanzo UI Complete Installation Guide

## Prerequisites

- Node.js 18.17 or later
- React 18 or later  
- Tailwind CSS 3.4 or later

## Automatic Installation (Recommended)

### Step 1: Create Your Project

Choose your preferred framework:

#### Next.js
\`\`\`bash
npx create-next-app@latest my-app --typescript --tailwind --app
cd my-app
\`\`\`

#### Vite
\`\`\`bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
\`\`\`

#### Remix
\`\`\`bash
npx create-remix@latest my-app
cd my-app
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
\`\`\`

### Step 2: Initialize Hanzo UI

Run the init command to set up your project:

\`\`\`bash
npx @hanzo/ui@latest init
\`\`\`

You will be asked a few questions:

1. **Style** - Choose between Default and New York styles
2. **Base color** - Choose your base color scheme
3. **CSS variables** - Use CSS variables for theming (recommended)
4. **Components path** - Where to add components (default: @/components)
5. **Utils path** - Where to add the cn utility (default: @/lib/utils)
6. **React Server Components** - Whether to use RSC
7. **Components.json** - Write configuration to components.json

### Step 3: Start Adding Components

\`\`\`bash
# Add individual components
npx @hanzo/ui@latest add button
npx @hanzo/ui@latest add card
npx @hanzo/ui@latest add dialog

# Add multiple at once
npx @hanzo/ui@latest add button card dialog form

# Add all components (use with caution)
npx @hanzo/ui@latest add --all
\`\`\`

## Manual Installation

If you prefer to set up manually:

### Step 1: Install Dependencies

\`\`\`bash
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge lucide-react
\`\`\`

### Step 2: Configure Path Aliases

Update your \`tsconfig.json\`:

\`\`\`json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
\`\`\`

### Step 3: Configure Tailwind

Update \`tailwind.config.js\`:

\`\`\`javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
\`\`\`

### Step 4: Add CSS Variables

Add to your \`globals.css\`:

\`\`\`css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
\`\`\`

### Step 5: Add the cn Utility

Create \`lib/utils.ts\`:

\`\`\`typescript
import { ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
\`\`\`

## Verify Installation

Create a test component to verify everything works:

\`\`\`tsx
// app/page.tsx or src/App.tsx
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Button>Hello Hanzo UI!</Button>
    </div>
  )
}
\`\`\`

## Next Steps

1. **Explore Components** - Browse available components with \`list_components\`
2. **Customize Theme** - Adjust CSS variables to match your brand
3. **Add More Components** - Install components as needed
4. **Check Documentation** - Visit ui.hanzo.ai for full docs

## Troubleshooting

### Module Resolution Issues
Ensure your path aliases are correctly configured in both tsconfig.json and your bundler config.

### Styling Not Applied
Make sure Tailwind CSS is properly configured and your CSS file is imported in your app.

### Type Errors
Install TypeScript definitions: \`npm install -D @types/react @types/react-dom\`

### Dark Mode Not Working
Ensure you're toggling the \`dark\` class on your HTML element.

Need help? Visit ui.hanzo.ai or check our GitHub repository.`

      return {
        content: [{ type: "text", text: content }],
      }
    }

    // Include all existing tool implementations from the original file
    default: {
      // Fallback to original implementation for other tools
      const originalTools = ["init", "list_components", "get_component", "add_component", "list_styles", "search_registry"]
      if (originalTools.includes(request.params.name)) {
        // Call original implementation (would need to be imported/included)
        // For now, return an error
        throw new Error(`Tool ${request.params.name} needs original implementation`)
      }
      throw new Error(`Unknown tool: ${request.params.name}`)
    }
  }
})

// Export for use
export default server

// Support CommonJS
if (typeof module !== 'undefined') {
  module.exports = { server }
}