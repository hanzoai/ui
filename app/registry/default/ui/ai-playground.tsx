"use client"

import * as React from "react"
import {
  AlertCircle,
  Check,
  Copy,
  Loader2,
  Send,
  Settings2,
  Sparkles,
  Trash2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/registry/default/ui/alert"
import { Button } from "@/registry/default/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card"
import { Label } from "@/registry/default/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select"
import { Slider } from "@/registry/default/ui/slider"
import { Textarea } from "@/registry/default/ui/textarea"

// Available AI Models
const AI_MODELS = [
  { value: "gpt-4", label: "GPT-4", provider: "OpenAI" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo", provider: "OpenAI" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", provider: "OpenAI" },
  { value: "claude-3-opus", label: "Claude 3 Opus", provider: "Anthropic" },
  { value: "claude-3-sonnet", label: "Claude 3 Sonnet", provider: "Anthropic" },
  { value: "claude-3-haiku", label: "Claude 3 Haiku", provider: "Anthropic" },
  { value: "llama-3-70b", label: "Llama 3 70B", provider: "Meta" },
  { value: "llama-3-8b", label: "Llama 3 8B", provider: "Meta" },
  { value: "mixtral-8x7b", label: "Mixtral 8x7B", provider: "Mistral" },
  { value: "gemini-pro", label: "Gemini Pro", provider: "Google" },
] as const

type AIModel = (typeof AI_MODELS)[number]["value"]

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  model?: AIModel
}

interface AIPlaygroundProps {
  className?: string
  defaultModel?: AIModel
  defaultSystemPrompt?: string
  onSendMessage?: (message: string, config: PlaygroundConfig) => Promise<string>
  showSettings?: boolean
}

interface PlaygroundConfig {
  model: AIModel
  temperature: number
  maxTokens: number
  systemPrompt: string
}

export function AIPlayground({
  className,
  defaultModel = "gpt-4",
  defaultSystemPrompt = "You are a helpful AI assistant.",
  onSendMessage,
  showSettings = true,
}: AIPlaygroundProps) {
  // State management
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [showConfig, setShowConfig] = React.useState(false)

  // Configuration state
  const [config, setConfig] = React.useState<PlaygroundConfig>({
    model: defaultModel,
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: defaultSystemPrompt,
  })

  // Refs
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle sending a message
  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      let response: string

      if (onSendMessage) {
        // Use custom message handler if provided
        response = await onSendMessage(userMessage.content, config)
      } else {
        // Mock response for demo purposes
        await new Promise((resolve) => setTimeout(resolve, 1000))
        response = `This is a mock response from ${config.model}. In a real implementation, this would call your AI API with the following configuration:

Model: ${config.model}
Temperature: ${config.temperature}
Max Tokens: ${config.maxTokens}
System Prompt: ${config.systemPrompt}

Your message: "${userMessage.content}"`
      }

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: response,
        timestamp: new Date(),
        model: config.model,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message")
    } finally {
      setIsLoading(false)
      // Focus back on textarea
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }

  // Handle copying message content
  const handleCopy = async (message: Message) => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopiedId(message.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      setError("Failed to copy to clipboard")
    }
  }

  // Handle clearing all messages
  const handleClear = () => {
    setMessages([])
    setError(null)
  }

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Card className={cn("w-full max-w-4xl", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Playground
            </CardTitle>
            <CardDescription>
              Interact with various AI models in real-time
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="h-8"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
            {showSettings && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfig(!showConfig)}
                className="h-8"
              >
                <Settings2 className="h-4 w-4 mr-1" />
                Settings
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Configuration Panel */}
        {showConfig && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select
                  value={config.model}
                  onValueChange={(value: AIModel) =>
                    setConfig((prev) => ({ ...prev, model: value }))
                  }
                >
                  <SelectTrigger id="model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex flex-col">
                          <span>{model.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {model.provider}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-tokens">
                  Max Tokens: {config.maxTokens}
                </Label>
                <Slider
                  id="max-tokens"
                  min={100}
                  max={4000}
                  step={100}
                  value={[config.maxTokens]}
                  onValueChange={(value) =>
                    setConfig((prev) => ({ ...prev, maxTokens: value[0] }))
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">
                Temperature: {config.temperature.toFixed(1)}
              </Label>
              <Slider
                id="temperature"
                min={0}
                max={2}
                step={0.1}
                value={[config.temperature]}
                onValueChange={(value) =>
                  setConfig((prev) => ({ ...prev, temperature: value[0] }))
                }
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Lower values make the output more focused and deterministic
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="system-prompt">System Prompt</Label>
              <Textarea
                id="system-prompt"
                placeholder="Enter system prompt..."
                value={config.systemPrompt}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    systemPrompt: e.target.value,
                  }))
                }
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Messages Container */}
        <div className="rounded-lg border bg-muted/30 min-h-[300px] max-h-[500px] overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
              <Sparkles className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Start a conversation with AI</p>
              <p className="text-xs mt-1">
                Using {AI_MODELS.find((m) => m.value === config.model)?.label}
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-lg px-4 py-2 max-w-[80%] relative group",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.role === "assistant" && message.model && (
                      <div className="text-xs opacity-70 mb-1">
                        {
                          AI_MODELS.find((m) => m.value === message.model)
                            ?.label
                        }
                      </div>
                    )}
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs opacity-50">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(message)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {copiedId === message.id ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="rounded-lg px-4 py-2 bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="min-h-[80px] resize-none flex-1"
          />
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-[80px]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground">
        <p>
          Model: {AI_MODELS.find((m) => m.value === config.model)?.label} •
          Temperature: {config.temperature} • Max Tokens: {config.maxTokens}
        </p>
      </CardFooter>
    </Card>
  )
}

// Export additional types for external use
export type { Message, PlaygroundConfig, AIPlaygroundProps }
export { AI_MODELS }
