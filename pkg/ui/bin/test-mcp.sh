#!/bin/bash

# Test script for verifying the Hanzo UI MCP functionality

# Set a test registry URL
export REGISTRY_URL="https://ui.shadcn.com/registry/registry.json"

echo "Testing Hanzo UI MCP Server"
echo "============================"
echo ""
echo "This script will test the following functionalities:"
echo "1. Loading the server from NPX"
echo "2. Server startup with custom registry URL"
echo ""

# First test: Simple command check
echo "Test 1: Check if the NPX command is recognized"
# Just check if the command exists without running it
which npx > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ NPX is available"
else
  echo "❌ NPX is not installed"
  exit 1
fi

# Second test: Server startup check
echo ""
echo "Test 2: Server startup (will exit automatically after 3 seconds)"
echo "Running: REGISTRY_URL=$REGISTRY_URL timeout 3 npx @hanzo/ui registry:mcp"
echo ""
echo "Expected output: You should see the server startup message"
echo ""

# Run with timeout to automatically kill after 3 seconds
# This works because the MCP server doesn't terminate on its own
timeout 3 npx @hanzo/ui registry:mcp 2>&1 | grep "Starting Hanzo UI MCP server"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Server startup message detected"
else
  echo ""
  echo "❌ Server failed to start properly"
  exit 1
fi

echo ""
echo "All tests completed successfully!"
echo ""
echo "The Hanzo UI MCP server is ready to be used in your MCP configuration with:"
echo "npx @hanzo/ui registry:mcp"
