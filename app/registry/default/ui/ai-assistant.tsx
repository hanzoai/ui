"use client"

import * as React from "react"
import { Bot, MessageSquare, Settings, Sparkles, User } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/default/ui/avatar"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card"
import { ScrollArea } from "@/registry/default/ui/scroll-area"
import { Separator } from "@/registry/default/ui/separator"
import { Textarea } from "@/registry/default/ui/textarea"

export interface AIAssistantProps extends React.HTMLAttributes<HTMLDivElement> {
  provider?: string
  model?: string
  apiKey?: string
  systemPrompt?: string
  tools?: Array<{ name: string; description: string; parameters?: any }>
  onResponse?: (response: any) => void
  onError?: (error: Error) => void
  messages?: Array<{
    id: string
    role: "user" | "assistant" | "system"
    content: string
    timestamp: Date
  }>
  onSendMessage?: (message: string) => void
  isLoading?: boolean
  placeholder?: string
  showAvatar?: boolean
  showTimestamp?: boolean
}

const AIAssistant = React.forwardRef<HTMLDivElement, AIAssistantProps>(
  (
    {
      className,
      children,
      provider = "openai",
      model = "gpt-4",
      messages = [],
      onSendMessage,
      isLoading = false,
      placeholder = "Ask the AI assistant anything...",
      showAvatar = true,
      showTimestamp = true,
      tools = [],
      ...props
    },
    ref
  ) => {
    const [input, setInput] = React.useState("")
    const scrollRef = React.useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when new messages arrive
    React.useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, [messages])

    const handleSend = () => {
      if (!input.trim() || isLoading) return
      onSendMessage?.(input)
      setInput("")
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    }

    return (
      <div
        ref={ref}
        className={cn("flex h-full w-full flex-col", className)}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">AI Assistant</h3>
              <p className="text-sm text-muted-foreground">
                {provider} • {model}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {tools.length > 0 && (
              <Badge variant="secondary">{tools.length} tools</Badge>
            )}
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h4 className="text-lg font-medium text-muted-foreground">
                  Start a conversation
                </h4>
                <p className="text-sm text-muted-foreground">
                  Ask me anything and I'll do my best to help!
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {showAvatar && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback>
                        {message.role === "user" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "flex max-w-[80%] flex-col space-y-1",
                      message.role === "user" ? "items-end" : "items-start"
                    )}
                  >
                    {showTimestamp && (
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    )}
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-current" />
                    </div>
                    <span>AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={isLoading}
              className="min-h-[60px] resize-none"
              rows={2}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="shrink-0"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {children}
      </div>
    )
  }
)
AIAssistant.displayName = "AIAssistant"

export { AIAssistant }
