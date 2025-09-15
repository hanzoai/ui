#!/bin/bash

# Find the registry-mcp.js file in the node_modules directory
MCP_SCRIPT=$(find ./node_modules -path "*/@hanzo/ui/bin/registry-mcp.js" -type f | head -1)

if [ -z "$MCP_SCRIPT" ]; then
  echo "Error: @hanzo/ui registry-mcp.js not found."
  echo "Please make sure @hanzo/ui is installed or run 'npm install @hanzo/ui' first."
  exit 1
fi

# Set the REGISTRY_URL environment variable if not already set
if [ -z "$REGISTRY_URL" ]; then
  export REGISTRY_URL="https://ui.hanzo.ai/registry/registry.json"
  echo "Using default registry URL: $REGISTRY_URL"
fi

# Execute the MCP script
node "$MCP_SCRIPT"
