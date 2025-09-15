# Hanzo UI with MCP Support

This implementation provides Model Context Protocol (MCP) support for the Hanzo UI library, enabling AI assistants to interact with the component registry based on shadcn/ui.

## Quick Start

```bash
# Run with npx (recommended)
npx @hanzo/ui registry:mcp

# Or set a custom registry URL
npx @hanzo/ui registry:mcp --registry=https://ui.hanzo.ai/registry/registry.json

# Run in HTTP mode instead of stdio
npx @hanzo/ui registry:mcp --http --port=3333
```

## Setup and Usage

### Configure Your LLM Tool

To configure your AI assistant or LLM to use the Hanzo UI MCP server, add the following configuration:

```json
{
  "name": "hanzo-ui",
  "command": "npx @hanzo/ui registry:mcp"
}
```

### Available Tools

The MCP server provides the following tools for AI assistants:

1. `init` - Initialize a new project using @hanzo/ui components and styles
2. `list_components` - List all available components in the registry
3. `get_component` - Get detailed information about a specific component
4. `add_component` - Get instructions for adding a component to a project
5. `list_styles` - List all available styles in the registry
6. `search_registry` - Search the registry for components matching criteria

### Registry Configuration

The registry URL can be configured by setting the `REGISTRY_URL` environment variable:

```bash
export REGISTRY_URL="https://ui.hanzo.ai/registry/registry.json"
npx @hanzo/ui registry:mcp
```

Or by using the `--registry` command-line option:

```bash
npx @hanzo/ui registry:mcp --registry=https://ui.hanzo.ai/registry/registry.json
```

## HTTP Mode

You can run the MCP server in HTTP mode, which exposes the server over HTTP rather than stdio:

```bash
npx @hanzo/ui registry:mcp --http --port=3333
```

This allows you to access the MCP server directly from web applications or other HTTP clients.

## Developer Instructions

### Building from Source

```bash
# Clone the repository
git clone https://github.com/hanzoai/ui.git
cd ui/pkg/ui

# Install dependencies
npm install

# Build the package
npm run build

# Run the MCP server
node ./bin/cli.js registry:mcp
```

### Project Structure

- `/pkg/ui/mcp/`: MCP server implementation
- `/pkg/ui/registry/`: Registry schema and API
- `/pkg/ui/bin/`: CLI tools for running the MCP server

### Creating a Registry

The registry is compatible with shadcn/ui's registry format. To create a custom registry:

1. Create a `registry.json` file using the schema from `/pkg/ui/registry/schema.ts`
2. Build the registry using a build script
3. Host the registry files on a web server or CDN
4. Point the MCP server to your custom registry using the `--registry` option

## How It Works

The MCP server enables AI assistants to:

1. Discover and browse available components in your registry
2. Fetch detailed information about specific components
3. Provide instructions on adding components to projects
4. Initialize new projects with your component library

This makes it easy for users to interact with your UI library through conversational interfaces.

## Example Interactions

### Initialize a Project

```
Assistant: To create a new project with Hanzo UI components, you can run:

npx create-next-app@latest my-app
cd my-app
npx @hanzo/ui@latest init
```

### Add a Component

```
Assistant: To add the Button component to your project:

npx @hanzo/ui@latest add button

This will install the component and its dependencies.
```

### Search for Components

```
Assistant: I found several form-related components:
- form
- input
- checkbox
- select
- textarea

Which one would you like to add to your project?
```

## Technical Details

### Registry Schema

The registry schema is compatible with shadcn/ui and includes:

- Component metadata (name, description, type)
- Dependencies (npm packages)
- Registry dependencies (other components)
- Component files with source code
- Category and subcategory information

### MCP Integration

The MCP server implements the Model Context Protocol, enabling AI assistants to:

- Query the registry for components
- Get detailed information about components
- Provide installation instructions
- Generate example usage code

### Command-Line Interface

The CLI provides options for:

- Setting the registry URL
- Running in HTTP mode
- Specifying the port for HTTP mode
- Verbose logging
