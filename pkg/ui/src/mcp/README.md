# Hanzo UI MCP Server

The Hanzo UI MCP (Model Context Protocol) server provides AI assistants with comprehensive access to the Hanzo UI component library, enabling them to browse, search, and help developers use Hanzo UI components effectively.

## Quick Start

### For AI Clients

Configure your AI client to use the Hanzo UI MCP server:

**Claude Desktop** (`.mcp.json`):
```json
{
  "mcpServers": {
    "hanzo-ui": {
      "command": "npx",
      "args": ["@hanzo/ui@latest", "mcp"]
    }
  }
}
```

**Cursor** (`.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "hanzo-ui": {
      "command": "npx",
      "args": ["@hanzo/ui@latest", "mcp"]
    }
  }
}
```

**VS Code** (`.vscode/mcp.json`):
```json
{
  "mcpServers": {
    "hanzo-ui": {
      "command": "npx",
      "args": ["@hanzo/ui@latest", "mcp"]
    }
  }
}
```

### Manual Usage

```bash
# Run the MCP server (stdio mode for AI clients)
npx @hanzo/ui mcp

# Run in HTTP mode for testing
npx @hanzo/ui mcp --http --port 3333

# Use custom registry
npx @hanzo/ui mcp --registry https://my-registry.com/registry.json

# Legacy command (still works)
npx @hanzo/ui registry:mcp
```

## Available Tools

The enhanced MCP server provides comprehensive tools:

1. **Component Management**
   - `init` - Initialize a new project with Hanzo UI
   - `list_components` - List all available components
   - `get_component` - Get detailed component information
   - `get_component_source` - Get full component source code
   - `get_component_demo` - Get demo implementation
   - `add_component` - Get installation instructions

2. **Blocks & Patterns**
   - `list_blocks` - List UI blocks and patterns
   - `get_block` - Get block details

3. **Search & Discovery**
   - `search_registry` - Search components by name/description
   - `list_styles` - View available styles
   - `get_installation_guide` - Complete setup guide

## Available Resources

The MCP server exposes these resources:
- `hanzo://components/list` - Complete component catalog
- `hanzo://blocks/list` - UI blocks and patterns  
- `hanzo://installation/guide` - Installation guide
- `hanzo://theming/guide` - Theming documentation

## Available Prompts

AI-assisted development prompts:
- `component_usage` - Generate usage examples
- `build_page` - Build complete pages
- `component_composition` - Create custom components
- `accessibility_review` - Review accessibility
- `theme_customization` - Generate custom themes

## Example Interactions

Ask your AI assistant:

- "Show me all available Hanzo UI components"
- "How do I use the Dialog component?"
- "Build a login form using Hanzo UI"
- "Create a dashboard layout with Hanzo components"
- "Generate a dark theme with purple accents"
- "Create a custom date picker using Hanzo primitives"

## Development

To build the MCP server:

```bash
cd pkg/ui
pnpm build
```

This will compile the TypeScript files and make the MCP server available.

## Registry Format

The registry follows the same format as shadcn/ui registries, with items defined as:

```json
{
  "name": "button",
  "type": "registry:component",
  "description": "A button component with different variants.",
  "files": [
    {
      "path": "components/ui/button.tsx",
      "type": "registry:component"
    }
  ]
}
```

To configure your own registry, set the `REGISTRY_URL` environment variable before running the MCP server.
