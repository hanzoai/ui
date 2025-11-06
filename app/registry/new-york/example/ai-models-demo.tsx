"use client"

import { useState } from "react"

import { AIModels } from "@/registry/new-york/ui/ai-models"

const models = [
  // OpenAI Models
  {
    id: "gpt-4-turbo-preview",
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    description: "Latest GPT-4 with 128K context",
  },
  {
    id: "gpt-4",
    name: "GPT-4",
    provider: "OpenAI",
    description: "Standard GPT-4 with 8K context",
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    description: "Fast and cost-effective",
  },

  // Anthropic Models
  {
    id: "claude-3-opus-20240229",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    description: "Most capable Claude model",
  },
  {
    id: "claude-3-sonnet-20240229",
    name: "Claude 3 Sonnet",
    provider: "Anthropic",
    description: "Balanced performance and speed",
  },
  {
    id: "claude-3-haiku-20240307",
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    description: "Fastest Claude model",
  },

  // Google Models
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    provider: "Google",
    description: "Multimodal AI model",
  },
  {
    id: "gemini-pro-vision",
    name: "Gemini Pro Vision",
    provider: "Google",
    description: "Gemini with vision capabilities",
  },

  // Open Source Models
  {
    id: "mixtral-8x7b-instruct",
    name: "Mixtral 8x7B",
    provider: "Mistral AI",
    description: "Open source mixture of experts",
  },
  {
    id: "llama-2-70b-chat",
    name: "LLaMA 2 70B",
    provider: "Meta",
    description: "Open source large language model",
  },
]

export default function AIModelsDemo() {
  const [selectedModel, setSelectedModel] = useState("gpt-4-turbo-preview")

  const currentModel = models.find((m) => m.id === selectedModel)

  return (
    <div className="flex flex-col gap-4">
      <AIModels
        models={models}
        selectedModel={selectedModel}
        onModelSelect={setSelectedModel}
      />

      {currentModel && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-semibold">{currentModel.name}</h3>
          <p className="mb-2 text-sm text-muted-foreground">
            Provider: {currentModel.provider}
          </p>
          <p className="text-sm text-muted-foreground">
            {currentModel.description}
          </p>
        </div>
      )}
    </div>
  )
}
