"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { format } from "date-fns"
import {
  Bot,
  Copy,
  MoreHorizontal,
  Paperclip,
  RotateCcw,
  Send,
  User,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/default/ui/avatar"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/registry/default/ui/dropdown-menu"
import { ScrollArea } from "@/registry/default/ui/scroll-area"
import { Separator } from "@/registry/default/ui/separator"
import { Textarea } from "@/registry/default/ui/textarea"

// Types
export interface ChatMessage {
  id: string
  content: string
  role: "user" | "assistant" | "system"
  timestamp: Date
  attachments?: ChatAttachment[]
  isGenerating?: boolean
}

export interface ChatAttachment {
  id: string
  name: string
  size: number
  type: string
  url?: string
  file?: File
}

export interface AIChatProps extends React.HTMLAttributes<HTMLDivElement> {
  messages?: ChatMessage[]
  onSendMessage?: (content: string, attachments?: ChatAttachment[]) => void
  onRegenerateMessage?: (messageId: string) => void
  onCopyMessage?: (content: string) => void
  isGenerating?: boolean
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  showTimestamps?: boolean
  showAvatars?: boolean
  userAvatar?: string
  assistantAvatar?: string
  userName?: string
  assistantName?: string
  allowAttachments?: boolean
  maxAttachments?: number
  maxAttachmentSize?: number
  acceptedFileTypes?: string[]
}

// Message variants
const messageVariants = cva(
  "group relative flex gap-3 rounded-lg p-4 transition-colors",
  {
    variants: {
      role: {
        user: "ml-8 bg-primary text-primary-foreground",
        assistant: "mr-8 bg-muted",
        system: "mx-4 bg-accent text-accent-foreground text-sm",
      },
    },
    defaultVariants: {
      role: "assistant",
    },
  }
)

// Typing indicator component
const TypingIndicator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-1 text-muted-foreground", className)}
    {...props}
  >
    <div className="flex gap-1">
      <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
      <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
      <div className="h-2 w-2 animate-bounce rounded-full bg-current" />
    </div>
    <span className="text-sm">AI is typing...</span>
  </div>
))
TypingIndicator.displayName = "TypingIndicator"

// Message component
const ChatMessageComponent = React.forwardRef<
  HTMLDivElement,
  {
    message: ChatMessage
    onCopy?: (content: string) => void
    onRegenerate?: (messageId: string) => void
    showTimestamp?: boolean
    showAvatar?: boolean
    userAvatar?: string
    assistantAvatar?: string
    userName?: string
    assistantName?: string
  } & React.HTMLAttributes<HTMLDivElement>
>(
  (
    {
      message,
      onCopy,
      onRegenerate,
      showTimestamp = true,
      showAvatar = true,
      userAvatar,
      assistantAvatar,
      userName,
      assistantName,
      className,
      ...props
    },
    ref
  ) => {
    const [isCopied, setIsCopied] = React.useState(false)

    const handleCopy = async () => {
      if (onCopy) {
        onCopy(message.content)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      }
    }

    const handleRegenerate = () => {
      if (onRegenerate && message.role === "assistant") {
        onRegenerate(message.id)
      }
    }

    const formatContent = (content: string) => {
      // Basic markdown rendering - in a real implementation, you'd use a proper markdown library
      return content
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`(.*?)`/g, '<code class="bg-muted px-1 rounded">$1</code>')
        .replace(
          /```([\s\S]*?)```/g,
          '<pre class="bg-muted p-3 rounded-lg overflow-x-auto"><code>$1</code></pre>'
        )
    }

    return (
      <div
        ref={ref}
        className={cn(messageVariants({ role: message.role }), className)}
        {...props}
      >
        {showAvatar && message.role !== "system" && (
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage
              src={message.role === "user" ? userAvatar : assistantAvatar}
              alt={message.role === "user" ? userName : assistantName}
            />
            <AvatarFallback>
              {message.role === "user" ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </AvatarFallback>
          </Avatar>
        )}

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showTimestamp && (
                <time className="text-xs text-muted-foreground">
                  {format(message.timestamp, "HH:mm")}
                </time>
              )}
              {message.role !== "system" && (
                <span className="text-xs font-medium">
                  {message.role === "user"
                    ? userName || "You"
                    : assistantName || "AI Assistant"}
                </span>
              )}
            </div>

            {message.role !== "system" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                    <span className="sr-only">Message actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleCopy}>
                    <Copy className="mr-2 h-3 w-3" />
                    {isCopied ? "Copied!" : "Copy"}
                  </DropdownMenuItem>
                  {message.role === "assistant" && onRegenerate && (
                    <DropdownMenuItem onClick={handleRegenerate}>
                      <RotateCcw className="mr-2 h-3 w-3" />
                      Regenerate
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
          />

          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {message.attachments.map((attachment) => (
                <Badge
                  key={attachment.id}
                  variant="secondary"
                  className="gap-1"
                >
                  <Paperclip className="h-3 w-3" />
                  {attachment.name}
                </Badge>
              ))}
            </div>
          )}

          {message.isGenerating && <TypingIndicator className="mt-2" />}
        </div>
      </div>
    )
  }
)
ChatMessageComponent.displayName = "ChatMessage"

// Attachment preview component
const AttachmentPreview = React.forwardRef<
  HTMLDivElement,
  {
    attachment: ChatAttachment
    onRemove?: (id: string) => void
  } & React.HTMLAttributes<HTMLDivElement>
>(({ attachment, onRemove, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-2 rounded-lg border p-2 text-sm",
      className
    )}
    {...props}
  >
    <Paperclip className="h-4 w-4" />
    <div className="flex-1 truncate">
      <div className="font-medium">{attachment.name}</div>
      <div className="text-xs text-muted-foreground">
        {(attachment.size / 1024).toFixed(1)} KB
      </div>
    </div>
    {onRemove && (
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => onRemove(attachment.id)}
      >
        <span className="sr-only">Remove attachment</span>×
      </Button>
    )}
  </div>
))
AttachmentPreview.displayName = "AttachmentPreview"

// Main AI Chat component
const AIChat = React.forwardRef<HTMLDivElement, AIChatProps>(
  (
    {
      messages = [],
      onSendMessage,
      onRegenerateMessage,
      onCopyMessage,
      isGenerating = false,
      placeholder = "Type your message...",
      maxLength = 4000,
      disabled = false,
      showTimestamps = true,
      showAvatars = true,
      userAvatar,
      assistantAvatar,
      userName,
      assistantName,
      allowAttachments = true,
      maxAttachments = 5,
      maxAttachmentSize = 10 * 1024 * 1024, // 10MB
      acceptedFileTypes = ["image/*", ".pdf", ".txt", ".doc", ".docx"],
      className,
      ...props
    },
    ref
  ) => {
    const [input, setInput] = React.useState("")
    const [attachments, setAttachments] = React.useState<ChatAttachment[]>([])
    const scrollAreaRef = React.useRef<HTMLDivElement>(null)
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // Auto-scroll to bottom when new messages arrive
    React.useEffect(() => {
      if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current.querySelector(
          "[data-radix-scroll-area-viewport]"
        )
        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight
        }
      }
    }, [messages])

    // Handle file selection
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (!files || !allowAttachments) return

      const newAttachments: ChatAttachment[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (attachments.length + newAttachments.length >= maxAttachments) {
          break
        }

        if (file.size > maxAttachmentSize) {
          continue
        }

        newAttachments.push({
          id: `${Date.now()}-${i}`,
          name: file.name,
          size: file.size,
          type: file.type,
          file,
        })
      }

      setAttachments((prev) => [...prev, ...newAttachments])

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }

    // Handle sending message
    const handleSend = () => {
      if (!input.trim() && attachments.length === 0) return
      if (disabled || isGenerating) return

      onSendMessage?.(input, attachments.length > 0 ? attachments : undefined)
      setInput("")
      setAttachments([])

      // Focus back to textarea
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 0)
    }

    // Handle key press
    const handleKeyPress = (event: React.KeyboardEvent) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault()
        handleSend()
      }
    }

    // Remove attachment
    const removeAttachment = (id: string) => {
      setAttachments((prev) => prev.filter((att) => att.id !== id))
    }

    // Handle copy
    const handleCopy = async (content: string) => {
      try {
        await navigator.clipboard.writeText(content)
        onCopyMessage?.(content)
      } catch (err) {
        console.error("Failed to copy message:", err)
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex h-[600px] w-full flex-col overflow-hidden rounded-lg border bg-background",
          className
        )}
        {...props}
      >
        {/* Messages area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessageComponent
                key={message.id}
                message={message}
                onCopy={handleCopy}
                onRegenerate={onRegenerateMessage}
                showTimestamp={showTimestamps}
                showAvatar={showAvatars}
                userAvatar={userAvatar}
                assistantAvatar={assistantAvatar}
                userName={userName}
                assistantName={assistantName}
              />
            ))}
            {isGenerating && (
              <div className="mr-8 flex gap-3 rounded-lg bg-muted p-4">
                {showAvatars && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={assistantAvatar} alt={assistantName} />
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <TypingIndicator />
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Input area */}
        <div className="p-4">
          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="mb-3 space-y-2">
              {attachments.map((attachment) => (
                <AttachmentPreview
                  key={attachment.id}
                  attachment={attachment}
                  onRemove={removeAttachment}
                />
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                disabled={disabled || isGenerating}
                maxLength={maxLength}
                className="min-h-[60px] resize-none"
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-2">
              {allowAttachments && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={
                    disabled ||
                    isGenerating ||
                    attachments.length >= maxAttachments
                  }
                >
                  <Paperclip className="h-4 w-4" />
                  <span className="sr-only">Attach file</span>
                </Button>
              )}
              <Button
                onClick={handleSend}
                disabled={
                  disabled ||
                  isGenerating ||
                  (!input.trim() && attachments.length === 0)
                }
                size="icon"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </div>

          {/* Character count */}
          {maxLength && (
            <div className="mt-2 text-right text-xs text-muted-foreground">
              {input.length}/{maxLength}
            </div>
          )}
        </div>

        {/* Hidden file input */}
        {allowAttachments && (
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedFileTypes.join(",")}
            className="hidden"
            onChange={handleFileSelect}
          />
        )}
      </div>
    )
  }
)
AIChat.displayName = "AIChat"

export {
  AIChat,
  ChatMessageComponent as ChatMessage,
  TypingIndicator,
  AttachmentPreview,
  type ChatMessage as ChatMessageType,
  type ChatAttachment,
  type AIChatProps,
}
