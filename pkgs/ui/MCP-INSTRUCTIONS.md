# Using @hanzo/ui with AI Assistants

This guide explains how to use @hanzo/ui with AI assistants through the Model Context Protocol (MCP).

## Getting Started

1. Install the package:

```bash
npm install @hanzo/ui
```

2. Start the MCP server:

```bash
npx @hanzo/ui registry:mcp
```

3. Configure your AI assistant to use the server.

## Available Commands

- **Initialize a new project**:
  ```bash
  npx @hanzo/ui init --style=default
  ```

- **List available components**:
  ```bash
  npx @hanzo/ui list
  ```

- **Add a component**:
  ```bash
  npx @hanzo/ui add button
  ```

## Using with LLMs

AI Assistants like Claude or ChatGPT can help you explore and use the components. Just describe what you need, and the AI can guide you through:

- Finding the right component
- Installing and configuring it
- Using it in your project

Example prompt: "I need a dropdown menu component for my React project. Can you help me find and set it up using @hanzo/ui?"

## Registry Configuration

You can create a custom registry for your components, making them available through the same interface. To create a registry:

1. Set up the registry structure
2. Run the update-registry script
3. Host the registry files
4. Point to your custom registry:

```bash
npx @hanzo/ui registry:mcp --registry=https://your-registry-url.com/registry.json
```

## HTTP Mode

For web-based applications, you can run the MCP server in HTTP mode:

```bash
npx @hanzo/ui registry:mcp --http --port=3333
```

This exposes an HTTP endpoint at http://localhost:3333 that you can use to communicate with the MCP server.

## Learn More

For detailed documentation, see [README-MCP.md](./README-MCP.md) or visit the [Hanzo UI website](https://ui.hanzo.ai).
