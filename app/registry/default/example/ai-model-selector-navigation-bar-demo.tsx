import { AIModelSelectorNavigationBar } from "@/registry/default/ui/ai-model-selector-navigation-bar"

export default function AiModelSelectorNavigationBarDemo() {
  const models = [
    {
      id: "gpt-4",
      name: "GPT-4",
      provider: "OpenAI",
      description: "Most capable model for complex tasks",
    },
    {
      id: "gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      provider: "OpenAI",
      description: "Fast and efficient for most tasks",
    },
    {
      id: "claude-3-opus",
      name: "Claude 3 Opus",
      provider: "Anthropic",
      description: "Advanced reasoning and analysis",
    },
  ]

  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <AIModelSelectorNavigationBar models={models} currentModel="gpt-4" />
    </div>
  )
}
