import { AIModels } from "@/registry/new-york/ui/ai-models"

const models = [
  {
    id: "gpt-4",
    name: "GPT-4",
    description: "Most capable model for complex tasks",
    provider: "OpenAI",
  },
  {
    id: "claude-3",
    name: "Claude 3 Opus",
    description: "Powerful model for reasoning and analysis",
    provider: "Anthropic",
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    description: "Google's advanced AI model",
    provider: "Google",
  },
]

export default function AiModelsDemo() {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <AIModels models={models} selectedModel="gpt-4" />
    </div>
  )
}
