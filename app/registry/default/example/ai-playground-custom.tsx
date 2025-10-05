"use client"

import React from "react"

import {
  AIPlayground,
  type PlaygroundConfig,
} from "@/registry/default/ui/ai-playground"
import { Alert, AlertDescription } from "@/registry/default/ui/alert"
import { Button } from "@/registry/default/ui/button"

export default function AIPlaygroundCustomExample() {
  const [apiKey, setApiKey] = React.useState("")
  const [showApiKeyInput, setShowApiKeyInput] = React.useState(false)

  // Custom message handler that integrates with OpenAI API
  const handleSendMessage = async (
    message: string,
    config: PlaygroundConfig
  ) => {
    // This is a mock implementation - in production, you would:
    // 1. Send the request to your backend API
    // 2. Your backend would handle the OpenAI API call securely
    // 3. Return the response to the frontend

    if (!apiKey && config.model.startsWith("gpt")) {
      throw new Error("Please provide an OpenAI API key to use GPT models")
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock response based on the model
    const responses: Record<string, string> = {
      "gpt-4": `[GPT-4 Response] I understand you said: "${message}". This is a sophisticated response demonstrating advanced reasoning capabilities.`,
      "gpt-4-turbo": `[GPT-4 Turbo] Processing your request: "${message}". This model offers faster response times with similar quality.`,
      "gpt-3.5-turbo": `[GPT-3.5 Turbo] Got it! You mentioned: "${message}". This is a cost-effective solution for most use cases.`,
      "claude-3-opus": `[Claude 3 Opus] I see you're asking about: "${message}". Let me provide a thoughtful and nuanced response.`,
      "claude-3-sonnet": `[Claude 3 Sonnet] Understanding your query: "${message}". Here's a balanced and practical answer.`,
      "claude-3-haiku": `[Claude 3 Haiku] Quick response to: "${message}". Efficient and concise output.`,
      "llama-3-70b": `[Llama 3 70B] Open-source response to: "${message}". Powerful capabilities without API restrictions.`,
      "llama-3-8b": `[Llama 3 8B] Compact model processing: "${message}". Suitable for edge deployment.`,
      "mixtral-8x7b": `[Mixtral 8x7B] Mixture of experts analyzing: "${message}". Combining specialized knowledge domains.`,
      "gemini-pro": `[Gemini Pro] Multi-modal understanding of: "${message}". Integrated reasoning across modalities.`,
    }

    const response =
      responses[config.model] || `Processed: "${message}" with ${config.model}`

    // Add configuration details to response
    const configDetails = `

Configuration applied:
- Temperature: ${config.temperature} (${config.temperature < 0.5 ? "More focused" : config.temperature > 1.0 ? "More creative" : "Balanced"})
- Max Tokens: ${config.maxTokens}
- System Prompt: "${config.systemPrompt.slice(0, 50)}${config.systemPrompt.length > 50 ? "..." : ""}"`

    return response + configDetails
  }

  return (
    <div className="w-full space-y-4">
      {/* API Key Section (for demo purposes) */}
      <Alert>
        <AlertDescription>
          This is a demo implementation. In production, API keys should be
          handled securely on the backend.
        </AlertDescription>
      </Alert>

      {showApiKeyInput && (
        <div className="flex gap-2">
          <input
            type="password"
            placeholder="Enter API Key (optional for demo)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <Button onClick={() => setShowApiKeyInput(false)}>Save</Button>
        </div>
      )}

      {/* AI Playground with Custom Handler */}
      <AIPlayground
        onSendMessage={handleSendMessage}
        defaultSystemPrompt="You are a helpful AI assistant with expertise in software development, creative writing, and problem-solving."
        defaultModel="claude-3-opus"
      />

      {/* Additional Controls */}
      <div className="flex justify-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={() => setShowApiKeyInput(!showApiKeyInput)}
          className="hover:underline"
        >
          {showApiKeyInput ? "Hide" : "Configure"} API Key
        </button>
        <span>•</span>
        <a href="#" className="hover:underline">
          View Documentation
        </a>
        <span>•</span>
        <a href="#" className="hover:underline">
          Report Issue
        </a>
      </div>
    </div>
  )
}
