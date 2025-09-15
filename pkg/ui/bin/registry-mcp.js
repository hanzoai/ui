#!/usr/bin/env node

// This is the main entry point for the MCP server
// It should be runnable directly with npx @hanzo/ui registry:mcp

/**
 * This script starts the MCP server for Hanzo UI
 * It can be run with npx @hanzo/ui registry:mcp
 */
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");

// Import the server dynamically based on where it's available
async function loadServer() {
  try {
    // Try loading from dist directory (published package)
    return require("../dist/mcp/index.js").server;
  } catch (error) {
    try {
      // Fallback to direct import (development)
      return require("../mcp/index.js").server;
    } catch (innerError) {
      console.error("Failed to load the MCP server implementation:", innerError);
      process.exit(1);
    }
  }
}

// Start HTTP server if requested
async function startHttpServer(server) {
  try {
    // Dynamically import the HTTP transport - we don't want to require
    // this dependency if we're not using HTTP mode
    const { HttpServerTransport } = require("@modelcontextprotocol/sdk/server/http.js");
    
    // Get port from environment or use default
    const port = process.env.MCP_PORT || 3333;
    
    // Create HTTP transport
    const transport = new HttpServerTransport({
      port: parseInt(port, 10),
      cors: {
        origin: "*",  // Allow any origin
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
      },
    });
    
    // Connect the server to the transport
    await server.connect(transport);
    
    console.error(`MCP HTTP server listening on port ${port}`);
    console.error(`You can access the server at http://localhost:${port}`);
  } catch (error) {
    console.error("Failed to start HTTP server:", error);
    console.error("Falling back to STDIO mode...");
    return false;
  }
  
  return true;
}

async function main() {
  try {
    console.error("Loading Hanzo UI MCP server...");
    
    // Default registry URL if not set
    if (!process.env.REGISTRY_URL) {
      process.env.REGISTRY_URL = "https://ui.hanzo.ai/registry/registry.json";
      console.error(`Using default registry URL: ${process.env.REGISTRY_URL}`);
      console.error("You can set a custom registry URL with the REGISTRY_URL environment variable.");
    }

    // Load the server
    const server = await loadServer();
    
    // Check if we should use HTTP mode
    const useHttp = process.env.MCP_HTTP_MODE === "true";
    
    if (useHttp) {
      // Try to start HTTP server, fall back to stdio if it fails
      const httpStarted = await startHttpServer(server);
      if (!httpStarted) {
        // Fall back to stdio
        const transport = new StdioServerTransport();
        await server.connect(transport);
      }
    } else {
      // Use stdio mode
      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.error("MCP server running in stdio mode");
    }
  } catch (error) {
    console.error("Error starting MCP server:", error);
    process.exit(1);
  }
}

// Start the server
main();
