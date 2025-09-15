#!/bin/bash

# Set the registry URL
export REGISTRY_URL=${REGISTRY_URL:-"https://ui.hanzo.ai/registry/registry.json"}

echo "Starting Hanzo UI MCP server with registry URL: $REGISTRY_URL"
echo "This server enables AI assistants to interact with the Hanzo UI component library."
echo "Use this as the URL for 'npx @hanzo/ui registry:mcp' in your MCP configuration."
echo ""
echo "Press Ctrl+C to stop the server."

# Find the CLI script
if [ -f "./bin/cli.js" ]; then
  # In development directory structure
  node ./bin/cli.js registry:mcp
elif [ -f "./node_modules/@hanzo/ui/bin/cli.js" ]; then
  # Installed as dependency
  node ./node_modules/@hanzo/ui/bin/cli.js registry:mcp
else
  # Use npx as fallback
  npx @hanzo/ui registry:mcp
fi
