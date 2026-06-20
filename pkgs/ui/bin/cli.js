#!/usr/bin/env node

/**
 * Main CLI entry point for @hanzo/ui
 * Supports various commands including registry:mcp
 */

const { program } = require("commander");

// Define the version from the package.json
let version = "4.5.0";
try {
  const packageJson = require("../package.json");
  version = packageJson.version || version;
} catch (error) {
  // Use default version if package.json can't be loaded
}

// Set up the program
program
  .name("@hanzo/ui")
  .description("Hanzo UI Component Library CLI")
  .version(version);
  
// Add the MCP command (main command)
program
  .command("mcp")
  .description("Start the Hanzo UI MCP server for AI assistants")
  .option(
    "-r, --registry <url>", 
    "URL to the registry.json file",
    process.env.REGISTRY_URL || "https://ui.hanzo.ai/registry/registry.json"
  )
  .option(
    "-p, --port <port>",
    "Port to listen on (for HTTP mode)",
    "3333"
  )
  .option(
    "--http",
    "Run in HTTP mode instead of stdio mode",
    false
  )
  .action(async (options) => {
    // Delegate to the dedicated MCP binary
    require("./mcp.js");
  });

// Add the registry:mcp command (alias for compatibility)
program
  .command("registry:mcp")
  .description("Starts the registry MCP server (alias for 'mcp')")
  .option(
    "-r, --registry <url>", 
    "URL to the registry.json file",
    process.env.REGISTRY_URL
  )
  .option(
    "-p, --port <port>",
    "Port to listen on (for HTTP mode)",
    "3333"
  )
  .option(
    "--http",
    "Run in HTTP mode instead of stdio mode",
    false
  )
  .action(async (options) => {
    try {
      // Set environment variables based on options
      if (options.registry) {
        process.env.REGISTRY_URL = options.registry;
      }
      
      // Set port if running in HTTP mode
      if (options.http) {
        process.env.MCP_HTTP_MODE = "true";
        process.env.MCP_PORT = options.port;
      }

      // Show info about the server
      console.error("Starting Hanzo UI MCP server...");
      console.error(`Registry URL: ${process.env.REGISTRY_URL || "[Using default registry]"}`);
      
      if (options.http) {
        console.error(`Running in HTTP mode on port ${options.port}`);
      } else {
        console.error("Running in stdio mode");
      }
      
      // Load and run the MCP server script
      require("./registry-mcp.js");
    } catch (error) {
      console.error("Error starting MCP server:", error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
