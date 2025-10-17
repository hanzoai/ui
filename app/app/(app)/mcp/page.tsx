import Link from "next/link"
import { ArrowRightIcon, CodeIcon, TerminalIcon } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/registry/default/ui/tabs"

const setupGuides = [
  {
    name: "Claude Code",
    id: "claude",
    description: "Anthropic's official CLI for Claude",
    command:
      "claude mcp add --transport http hanzo-ui https://ui.hanzo.ai/api/mcp",
  },
  {
    name: "Cursor",
    id: "cursor",
    description: "AI-powered code editor",
    config: `{
  "mcpServers": {
    "hanzo-ui": {
      "command": "npx",
      "args": ["hanzo-ui@latest", "mcp"]
    }
  }
}`,
  },
  {
    name: "Windsurf",
    id: "windsurf",
    description: "Modern AI code editor",
    config: `{
  "mcpServers": {
    "hanzo-ui": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://hanzo-ui.ai/api/mcp"]
    }
  }
}`,
  },
  {
    name: "VS Code",
    id: "vscode",
    description: "Visual Studio Code with Claude extension",
    config: `{
  "claude.mcpServers": {
    "hanzo-ui": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://hanzo-ui.ai/api/mcp"]
    }
  }
}`,
  },
  {
    name: "JetBrains",
    id: "jetbrains",
    description: "IntelliJ IDEA, WebStorm, and other JetBrains IDEs",
    config: `{
  "mcpServers": {
    "hanzo-ui": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://hanzo-ui.ai/api/mcp"]
    }
  }
}`,
  },
  {
    name: "Zed",
    id: "zed",
    description: "High-performance multiplayer code editor",
    config: `{
  "mcpServers": {
    "hanzo-ui": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://hanzo-ui.ai/api/mcp"]
    }
  }
}`,
  },
]

export default function MCPPage() {
  return (
    <div className="container relative">
      <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20">
        <TerminalIcon className="h-12 w-12 text-primary" />
        <h1 className="text-center text-4xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
          MCP Server
        </h1>
        <p className="max-w-[750px] text-center text-lg text-muted-foreground sm:text-xl">
          Connect AI coding assistants to hanzo/ui components. Get accurate
          TypeScript props and React component data without hallucinations.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="#setup">
              Get Started
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="https://github.com/hanzoai/ui">View on GitHub</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl">
        <div className="mb-12 space-y-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">What is MCP?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Model Context Protocol (MCP) connects AI coding tools directly to
              component registries and documentation. Instead of relying on
              training data, your AI assistant gets real-time access to actual
              component implementations.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CodeIcon className="h-8 w-8 text-primary" />
                <CardTitle className="mt-2">Accurate Props</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get exact TypeScript props and interfaces, not outdated or
                  hallucinated types.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <TerminalIcon className="h-8 w-8 text-primary" />
                <CardTitle className="mt-2">Real Components</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Access actual component implementations from the registry, not
                  approximations.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <ArrowRightIcon className="h-8 w-8 text-primary" />
                <CardTitle className="mt-2">Live Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Always get the latest component versions and patterns as
                  they're updated.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        <div id="setup" className="space-y-8">
          <h2 className="text-3xl font-bold tracking-tight">Setup Guides</h2>

          <Tabs defaultValue="claude" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              {setupGuides.map((guide) => (
                <TabsTrigger key={guide.id} value={guide.id}>
                  {guide.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {setupGuides.map((guide) => (
              <TabsContent
                key={guide.id}
                value={guide.id}
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{guide.name} Setup</CardTitle>
                    <CardDescription>{guide.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="mb-2 font-semibold">Installation</h4>
                      {guide.command ? (
                        <div className="rounded-lg bg-muted p-4">
                          <code className="text-sm">{guide.command}</code>
                        </div>
                      ) : (
                        <div>
                          <p className="mb-2 text-sm text-muted-foreground">
                            Add this to your configuration file:
                          </p>
                          <div className="rounded-lg bg-muted p-4">
                            <pre className="text-sm">
                              <code>{guide.config}</code>
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="mb-2 font-semibold">Usage Examples</h4>
                      <div className="space-y-2 rounded-lg bg-muted p-4">
                        <p className="text-sm">
                          <code className="text-primary">
                            // List all components
                          </code>
                        </p>
                        <p className="text-sm">
                          use hanzo-ui to list all available components
                        </p>

                        <p className="mt-4 text-sm">
                          <code className="text-primary">
                            // Get component details
                          </code>
                        </p>
                        <p className="text-sm">
                          use hanzo-ui to show me the AI Playground component
                        </p>

                        <p className="mt-4 text-sm">
                          <code className="text-primary">
                            // Implement in your project
                          </code>
                        </p>
                        <p className="text-sm">
                          use hanzo-ui to add the AI Chat component to my app
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <div className="mt-12 space-y-8">
          <h2 className="text-3xl font-bold tracking-tight">What You Get</h2>

          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left font-semibold">Prompt</th>
                  <th className="p-4 text-left font-semibold">Without MCP</th>
                  <th className="p-4 text-left font-semibold">With MCP</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4">"Show me AI components"</td>
                  <td className="p-4 text-muted-foreground">
                    Generic AI input fields
                  </td>
                  <td className="p-4">
                    8 specialized AI components with props
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">"Add chat interface"</td>
                  <td className="p-4 text-muted-foreground">
                    Basic textarea with send button
                  </td>
                  <td className="p-4">
                    Full AI Chat with streaming, history, providers
                  </td>
                </tr>
                <tr>
                  <td className="p-4">"Implement AI playground"</td>
                  <td className="p-4 text-muted-foreground">
                    Random code snippets
                  </td>
                  <td className="p-4">
                    Complete AI Playground with parameters
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-20 rounded-lg border bg-muted/50 p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-2xl font-bold">Need Help?</h2>
            <p className="max-w-[600px] text-muted-foreground">
              Join our Discord community for help from other developers using
              MCP with hanzo/ui components.
            </p>
            <div className="flex gap-4">
              <Button asChild>
                <Link href="https://discord.gg/hanzo">Join Discord</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/docs">Read Documentation</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
