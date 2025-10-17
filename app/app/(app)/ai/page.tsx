import Link from "next/link"
import {
  ArrowRightIcon,
  BrainIcon,
  EyeIcon,
  MessageSquareIcon,
  PlayIcon,
  RocketIcon,
  SparklesIcon,
  UsersIcon,
  WrenchIcon,
} from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card"

const aiComponents = [
  {
    name: "AI Playground",
    href: "/docs/ai/playground",
    description:
      "Interactive AI model testing environment with adjustable parameters",
    icon: PlayIcon,
  },
  {
    name: "AI Chat",
    href: "/docs/ai/chat",
    description: "Complete chat interface with streaming support",
    icon: MessageSquareIcon,
  },
  {
    name: "AI Assistant",
    href: "/docs/ai/assistant",
    description: "Full-featured AI assistant component",
    icon: SparklesIcon,
  },
  {
    name: "AI Actions",
    href: "/docs/ai/actions",
    description: "Pre-built AI action components",
    icon: RocketIcon,
  },
  {
    name: "AI Models",
    href: "/docs/ai/models",
    description: "Model selection and management interface",
    icon: BrainIcon,
  },
  {
    name: "AI Vision",
    href: "/docs/ai/vision",
    description: "Image analysis and computer vision components",
    icon: EyeIcon,
  },
  {
    name: "AI Agents",
    href: "/docs/ai/agents",
    description: "Multi-agent system components",
    icon: UsersIcon,
  },
  {
    name: "AI Tools",
    href: "/docs/ai/tools",
    description: "Tool use and function calling interfaces",
    icon: WrenchIcon,
  },
]

export default function AIPage() {
  return (
    <div className="container relative">
      <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20">
        <SparklesIcon className="h-12 w-12 text-primary" />
        <h1 className="text-center text-4xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
          AI Components
        </h1>
        <p className="max-w-[750px] text-center text-lg text-muted-foreground sm:text-xl">
          Beautiful AI-powered components for building intelligent interfaces.
          Copy and paste into your apps.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/docs/ai">
              Get Started
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/examples">View Examples</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Production-ready AI components
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Built with React, TypeScript, and Tailwind CSS. Works with all major
            AI providers.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {aiComponents.map((component) => {
            const Icon = component.icon
            return (
              <Card key={component.name} className="relative">
                <Link href={component.href} className="absolute inset-0" />
                <CardHeader>
                  <Icon className="h-10 w-10 text-primary" />
                  <CardTitle className="mt-4">{component.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{component.description}</CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-20 space-y-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Features</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to build AI-powered applications
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-3">
              <h3 className="font-semibold">Multiple Providers</h3>
              <p className="text-muted-foreground">
                Support for OpenAI, Anthropic, Google AI, Cohere, and more.
                Switch providers with a single prop.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold">Real-time Streaming</h3>
              <p className="text-muted-foreground">
                Stream responses token by token for better user experience.
                Built-in loading states and animations.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold">Fully Customizable</h3>
              <p className="text-muted-foreground">
                Style with Tailwind CSS. Override any component. Extend with
                your own functionality.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold">TypeScript First</h3>
              <p className="text-muted-foreground">
                Full TypeScript support with proper types for all components and
                utilities.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold">Accessible</h3>
              <p className="text-muted-foreground">
                Built with accessibility in mind. Keyboard navigation, screen
                readers, and ARIA support.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold">Production Ready</h3>
              <p className="text-muted-foreground">
                Battle-tested components used in production by thousands of
                developers.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-20 rounded-lg border bg-muted/50 p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-2xl font-bold">Ready to build with AI?</h2>
            <p className="max-w-[600px] text-muted-foreground">
              Start building intelligent interfaces with our comprehensive
              collection of AI components.
            </p>
            <div className="flex gap-4">
              <Button asChild>
                <Link href="/docs/ai">Documentation</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="https://github.com/hanzoai/ui">GitHub</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
