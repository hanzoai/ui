// @ts-check
#!/usr/bin/env node

const { program } = require("commander")

program
  .name("npx @hanzo/ui registry:mcp")
  .description("Run the Hanzo UI registry with MCP support")
  .action(() => {
    console.log("Starting Hanzo UI MCP server...")
    // Execute the MCP server
    require("../bin/registry-mcp.js")
  })

program.parse()
