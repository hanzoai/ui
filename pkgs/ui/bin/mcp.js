#!/usr/bin/env node

/**
 * Hanzo UI MCP Server
 * 
 * This is the main entry point for the MCP server that can be run with:
 * - npx @hanzo/ui mcp
 * - npx @hanzo/ui@latest mcp
 * 
 * The server provides AI assistants with tools to:
 * - List and search components
 * - Get component source code and demos
 * - Access UI blocks and patterns
 * - Generate usage examples
 * - Create custom themes
 */

const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");

// Helper to load the server implementation
async function loadServer() {
  try {
    // Try loading from dist directory (published package)
    const distPath = require.resolve("../dist/mcp/enhanced-server.js");
    return require(distPath).default || require(distPath).server;
  } catch (error) {
    try {
      // Fallback to original server if enhanced not available
      const distPath = require.resolve("../dist/mcp/index.js");
      return require(distPath).server;
    } catch (innerError) {
      try {
        // Development mode - try to use ts-node if available
        const tsNode = require("ts-node");
        tsNode.register({
          transpileOnly: true,
          compilerOptions: {
            module: "commonjs",
            target: "es2020",
            esModuleInterop: true,
            allowSyntheticDefaultImports: true
          }
        });
        
        // Now try to load the TypeScript file
        try {
          const enhancedPath = require.resolve("../mcp/enhanced-server.ts");
          return require(enhancedPath).default || require(enhancedPath).server;
        } catch (e) {
          const srcPath = require.resolve("../mcp/index.ts");
          return require(srcPath).server;
        }
      } catch (tsError) {
        // If ts-node not available, create a basic server inline
        console.error("Creating basic MCP server (ts-node not available for enhanced features)");
        return createBasicServer();
      }
    }
  }
}

// Create a basic MCP server if we can't load the TypeScript files
function createBasicServer() {
  const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
  const { z } = require("zod");
  const { zodToJsonSchema } = require("zod-to-json-schema");
  
  const server = new Server(
    {
      name: "hanzo-ui",
      version: "4.5.0",
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  // Register basic tools
  const { ListToolsRequestSchema, CallToolRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
  
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "list_components",
          description: "List all available Hanzo UI components",
          inputSchema: zodToJsonSchema(z.object({})),
        },
        {
          name: "get_component",
          description: "Get information about a specific component",
          inputSchema: zodToJsonSchema(z.object({
            name: z.string().describe("Component name"),
          })),
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const args = request.params.arguments || {};
    
    switch (request.params.name) {
      case "list_components": {
        return {
          content: [{
            type: "text",
            text: `# Hanzo UI Components

The following components are available:
- accordion - Expandable accordion component
- alert - Alert message component
- avatar - User avatar display
- badge - Badge for labels and status
- button - Versatile button component
- card - Container card component
- checkbox - Checkbox input
- dialog - Modal dialog component
- drawer - Sliding drawer panel
- dropdown-menu - Dropdown menu component
- form - Form components and validation
- input - Text input field
- label - Form label component
- popover - Popover container
- radio-group - Radio button group
- select - Select dropdown
- separator - Visual separator
- sheet - Sheet modal component
- skeleton - Loading skeleton
- slider - Range slider input
- switch - Toggle switch
- table - Data table component
- tabs - Tab navigation
- textarea - Multiline text input
- toast - Toast notification
- tooltip - Tooltip component

Use 'get_component' to get more details about a specific component.`,
          }],
        };
      }
      
      case "get_component": {
        const name = args.name;
        return {
          content: [{
            type: "text",
            text: `# ${name} Component

To install the ${name} component:

\`\`\`bash
npx @hanzo/ui@latest add ${name}
\`\`\`

This will add the component to your project and install any required dependencies.

For more information, visit https://ui.hanzo.ai/docs/components/${name}`,
          }],
        };
      }
      
      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  });
  
  return server;
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    mode: 'stdio',
    port: 3333,
    registryUrl: process.env.REGISTRY_URL || 'https://ui.hanzo.ai/registry/registry.json',
    help: false,
    version: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--version' || arg === '-v') {
      options.version = true;
    } else if (arg === '--http') {
      options.mode = 'http';
    } else if (arg === '--port' && i + 1 < args.length) {
      options.port = parseInt(args[++i], 10);
    } else if (arg === '--registry' && i + 1 < args.length) {
      options.registryUrl = args[++i];
    }
  }

  return options;
}

// Display help message
function showHelp() {
  console.log(`
Hanzo UI MCP Server

Usage:
  npx @hanzo/ui mcp [options]

Options:
  --help, -h        Show this help message
  --version, -v     Show version information
  --http            Run in HTTP mode instead of stdio (experimental)
  --port <port>     Port for HTTP mode (default: 3333)
  --registry <url>  Custom registry URL

Examples:
  # Run MCP server (stdio mode for AI clients)
  npx @hanzo/ui mcp

  # Run in HTTP mode for testing
  npx @hanzo/ui mcp --http --port 3333

  # Use custom registry
  npx @hanzo/ui mcp --registry https://my-registry.com/registry.json

AI Client Configuration:

For Claude Desktop (.mcp.json):
  {
    "mcpServers": {
      "hanzo-ui": {
        "command": "npx",
        "args": ["@hanzo/ui", "mcp"]
      }
    }
  }

For Cursor (.cursor/mcp.json):
  {
    "mcpServers": {
      "hanzo-ui": {
        "command": "npx",
        "args": ["@hanzo/ui", "mcp"]
      }
    }
  }

For VS Code (.vscode/mcp.json):
  {
    "mcpServers": {
      "hanzo-ui": {
        "command": "npx",
        "args": ["@hanzo/ui", "mcp"]
      }
    }
  }

Available Tools:
  - init                    Initialize a new project
  - list_components         List all available components
  - get_component          Get component details
  - get_component_source   Get component source code
  - get_component_demo     Get component demo code
  - add_component          Add component to project
  - list_blocks            List UI blocks/patterns
  - get_block              Get block details
  - search_registry        Search for components
  - get_installation_guide Get installation guide

Available Resources:
  - hanzo://components/list     Complete component list
  - hanzo://blocks/list         UI blocks and patterns
  - hanzo://installation/guide  Installation guide
  - hanzo://theming/guide       Theming guide

Available Prompts:
  - component_usage         Generate usage examples
  - build_page             Build complete pages
  - component_composition  Create custom components
  - accessibility_review   Review accessibility
  - theme_customization    Generate custom themes

Learn more: https://ui.hanzo.ai/docs/mcp
  `);
}

// Display version information
function showVersion() {
  try {
    const packageJson = require("../package.json");
    console.log(`@hanzo/ui MCP Server v${packageJson.version}`);
  } catch (error) {
    console.log("@hanzo/ui MCP Server");
  }
}

// Start HTTP server (experimental)
async function startHttpServer(server, port) {
  try {
    // Dynamically import HTTP transport
    const { HttpServerTransport } = require("@modelcontextprotocol/sdk/server/http.js");
    
    const transport = new HttpServerTransport({
      port: port,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
      },
    });
    
    await server.connect(transport);
    
    console.log(`Hanzo UI MCP HTTP server listening on port ${port}`);
    console.log(`Access the server at http://localhost:${port}`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  GET  http://localhost:${port}/health`);
    console.log(`  POST http://localhost:${port}/mcp/v1/list_tools`);
    console.log(`  POST http://localhost:${port}/mcp/v1/call_tool`);
    console.log(`  POST http://localhost:${port}/mcp/v1/list_resources`);
    console.log(`  POST http://localhost:${port}/mcp/v1/read_resource`);
    console.log(`  POST http://localhost:${port}/mcp/v1/list_prompts`);
    console.log(`  POST http://localhost:${port}/mcp/v1/get_prompt`);
    console.log(`\nPress Ctrl+C to stop the server`);
    
    return true;
  } catch (error) {
    console.error("Failed to start HTTP server:", error.message);
    console.error("Falling back to stdio mode...");
    return false;
  }
}

// Main function
async function main() {
  const options = parseArgs();
  
  // Handle help and version flags
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  if (options.version) {
    showVersion();
    process.exit(0);
  }
  
  // Set registry URL in environment
  process.env.REGISTRY_URL = options.registryUrl;
  
  console.error(`Loading Hanzo UI MCP server...`);
  console.error(`Registry: ${options.registryUrl}`);
  
  try {
    // Load the server implementation
    const server = await loadServer();
    
    if (options.mode === 'http') {
      // Try HTTP mode
      const httpStarted = await startHttpServer(server, options.port);
      if (!httpStarted) {
        // Fall back to stdio if HTTP fails
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("MCP server running in stdio mode");
      }
    } else {
      // Default stdio mode
      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.error("MCP server running in stdio mode");
      console.error("Ready for AI client connections");
    }
  } catch (error) {
    console.error("Error starting MCP server:", error);
    console.error("\nTroubleshooting:");
    console.error("1. Make sure @hanzo/ui is properly installed");
    console.error("2. Try running: npm install @hanzo/ui@latest");
    console.error("3. Check that all dependencies are installed");
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.error("\nShutting down MCP server...");
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error("\nShutting down MCP server...");
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});