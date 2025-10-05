"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  ChevronRight,
  Copy,
  Download,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  RefreshCw,
  Settings,
  Square,
  Terminal,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import { Input } from "@/registry/default/ui/input"
import { ScrollArea } from "@/registry/default/ui/scroll-area"
import { Separator } from "@/registry/default/ui/separator"

const codeTerminalVariants = cva(
  "relative flex flex-col overflow-hidden rounded-lg border",
  {
    variants: {
      theme: {
        dark: "bg-black border-gray-700 text-green-400",
        light: "bg-white border-gray-300 text-gray-900",
        matrix: "bg-black border-green-500 text-green-400",
        hacker: "bg-gray-900 border-yellow-500 text-yellow-400",
        retro: "bg-amber-900 border-amber-600 text-amber-100",
        modern: "bg-slate-900 border-slate-700 text-slate-100",
      },
      size: {
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base",
      },
    },
    defaultVariants: {
      theme: "dark",
      size: "default",
    },
  }
)

export interface TerminalLine {
  id: string
  type: "input" | "output" | "error" | "system"
  content: string
  timestamp: number
  command?: string
  exitCode?: number
}

export interface CodeTerminalProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof codeTerminalVariants> {
  title?: string
  prompt?: string
  maxLines?: number
  showLineNumbers?: boolean
  allowInput?: boolean
  allowClear?: boolean
  allowCopy?: boolean
  allowDownload?: boolean
  allowFullscreen?: boolean
  height?: string
  autoScroll?: boolean
  history?: string[]
  onCommand?: (command: string) => void | Promise<void>
  onClear?: () => void
  initialLines?: TerminalLine[]
}

// ANSI color codes mapping
const ansiColors = {
  reset: "",
  black: "text-black",
  red: "text-red-500",
  green: "text-green-500",
  yellow: "text-yellow-500",
  blue: "text-blue-500",
  magenta: "text-magenta-500",
  cyan: "text-cyan-500",
  white: "text-white",
  gray: "text-gray-500",
  brightRed: "text-red-400",
  brightGreen: "text-green-400",
  brightYellow: "text-yellow-400",
  brightBlue: "text-blue-400",
  brightMagenta: "text-magenta-400",
  brightCyan: "text-cyan-400",
  brightWhite: "text-gray-100",
}

// Parse ANSI escape sequences
const parseAnsiContent = (content: string): React.ReactNode => {
  const ansiRegex = /\x1b\[([0-9;]*)m/g
  const parts: Array<{ text: string; classes: string[] }> = []
  let lastIndex = 0
  let currentClasses: string[] = []

  let match
  while ((match = ansiRegex.exec(content)) !== null) {
    // Add text before this escape sequence
    if (match.index > lastIndex) {
      parts.push({
        text: content.slice(lastIndex, match.index),
        classes: [...currentClasses],
      })
    }

    // Parse the escape sequence
    const codes = match[1].split(";").map((code) => parseInt(code) || 0)
    codes.forEach((code) => {
      switch (code) {
        case 0:
          currentClasses = []
          break // reset
        case 30:
          currentClasses.push(ansiColors.black)
          break
        case 31:
          currentClasses.push(ansiColors.red)
          break
        case 32:
          currentClasses.push(ansiColors.green)
          break
        case 33:
          currentClasses.push(ansiColors.yellow)
          break
        case 34:
          currentClasses.push(ansiColors.blue)
          break
        case 35:
          currentClasses.push(ansiColors.magenta)
          break
        case 36:
          currentClasses.push(ansiColors.cyan)
          break
        case 37:
          currentClasses.push(ansiColors.white)
          break
        case 90:
          currentClasses.push(ansiColors.gray)
          break
        case 91:
          currentClasses.push(ansiColors.brightRed)
          break
        case 92:
          currentClasses.push(ansiColors.brightGreen)
          break
        case 93:
          currentClasses.push(ansiColors.brightYellow)
          break
        case 94:
          currentClasses.push(ansiColors.brightBlue)
          break
        case 95:
          currentClasses.push(ansiColors.brightMagenta)
          break
        case 96:
          currentClasses.push(ansiColors.brightCyan)
          break
        case 97:
          currentClasses.push(ansiColors.brightWhite)
          break
      }
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({
      text: content.slice(lastIndex),
      classes: [...currentClasses],
    })
  }

  return parts.map((part, index) => (
    <span key={index} className={cn(part.classes)}>
      {part.text}
    </span>
  ))
}

const CodeTerminal = React.forwardRef<HTMLDivElement, CodeTerminalProps>(
  (
    {
      className,
      theme,
      size,
      title = "Terminal",
      prompt = "$",
      maxLines = 1000,
      showLineNumbers = false,
      allowInput = true,
      allowClear = true,
      allowCopy = true,
      allowDownload = false,
      allowFullscreen = true,
      height = "400px",
      autoScroll = true,
      history = [],
      onCommand,
      onClear,
      initialLines = [],
      ...props
    },
    ref
  ) => {
    const [lines, setLines] = React.useState<TerminalLine[]>(initialLines)
    const [input, setInput] = React.useState("")
    const [historyIndex, setHistoryIndex] = React.useState(-1)
    const [isFullscreen, setIsFullscreen] = React.useState(false)
    const [commandHistory, setCommandHistory] =
      React.useState<string[]>(history)

    const scrollAreaRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Auto-scroll to bottom
    React.useEffect(() => {
      if (autoScroll && scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
      }
    }, [lines, autoScroll])

    const addLine = React.useCallback(
      (line: Omit<TerminalLine, "id" | "timestamp">) => {
        const newLine: TerminalLine = {
          ...line,
          id: `line-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
        }

        setLines((prev) => {
          const updated = [...prev, newLine]
          return updated.length > maxLines ? updated.slice(-maxLines) : updated
        })
      },
      [maxLines]
    )

    const handleCommand = React.useCallback(
      async (command: string) => {
        if (!command.trim()) return

        // Add command to history
        setCommandHistory((prev) => [...prev, command])
        setHistoryIndex(-1)

        // Add input line
        addLine({
          type: "input",
          content: `${prompt} ${command}`,
          command,
        })

        // Handle built-in commands
        if (command === "clear") {
          if (onClear) {
            onClear()
          } else {
            setLines([])
          }
          return
        }

        if (command === "history") {
          commandHistory.forEach((cmd, index) => {
            addLine({
              type: "output",
              content: `${index + 1}  ${cmd}`,
            })
          })
          return
        }

        if (command.startsWith("echo ")) {
          addLine({
            type: "output",
            content: command.slice(5),
          })
          return
        }

        // Call custom command handler
        if (onCommand) {
          try {
            await onCommand(command)
          } catch (error) {
            addLine({
              type: "error",
              content: error instanceof Error ? error.message : String(error),
              exitCode: 1,
            })
          }
        } else {
          addLine({
            type: "error",
            content: `Command not found: ${command}`,
            exitCode: 127,
          })
        }
      },
      [prompt, addLine, onCommand, onClear, commandHistory]
    )

    const handleInputSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (input.trim()) {
        handleCommand(input)
        setInput("")
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault()
        if (historyIndex < commandHistory.length - 1) {
          const newIndex = historyIndex + 1
          setHistoryIndex(newIndex)
          setInput(commandHistory[commandHistory.length - 1 - newIndex] || "")
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1
          setHistoryIndex(newIndex)
          setInput(commandHistory[commandHistory.length - 1 - newIndex] || "")
        } else if (historyIndex === 0) {
          setHistoryIndex(-1)
          setInput("")
        }
      }
    }

    const copyContent = React.useCallback(async () => {
      const content = lines.map((line) => line.content).join("\n")

      try {
        await navigator.clipboard.writeText(content)
      } catch (error) {
        console.error("Failed to copy terminal content:", error)
      }
    }, [lines])

    const downloadContent = React.useCallback(() => {
      const content = lines
        .map(
          (line) =>
            `[${new Date(line.timestamp).toISOString()}] ${line.content}`
        )
        .join("\n")

      const blob = new Blob([content], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `terminal-${Date.now()}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, [lines])

    const clearTerminal = () => {
      if (onClear) {
        onClear()
      } else {
        setLines([])
      }
    }

    // Focus input when terminal is clicked
    const handleTerminalClick = () => {
      if (allowInput && inputRef.current) {
        inputRef.current.focus()
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          codeTerminalVariants({ theme, size }),
          isFullscreen && "fixed inset-0 z-50",
          className
        )}
        style={{ height: isFullscreen ? "100vh" : height }}
        onClick={handleTerminalClick}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <Terminal className="h-4 w-4" />
            <span className="text-sm font-medium">{title}</span>
            {lines.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {lines.length} lines
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {allowClear && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearTerminal}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}

            {allowCopy && (
              <Button
                variant="ghost"
                size="sm"
                onClick={copyContent}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )}

            {allowDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadContent}
                className="h-8 w-8 p-0"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            )}

            {allowFullscreen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="h-8 w-8 p-0"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <div className="space-y-1 font-mono">
              {lines.map((line, index) => (
                <div key={line.id} className="flex items-start gap-2">
                  {showLineNumbers && (
                    <span className="text-xs text-muted-foreground w-12 text-right flex-shrink-0">
                      {index + 1}
                    </span>
                  )}
                  <div
                    className={cn(
                      "flex-1 whitespace-pre-wrap break-words",
                      line.type === "input" && "text-inherit",
                      line.type === "output" && "text-muted-foreground",
                      line.type === "error" && "text-red-400",
                      line.type === "system" && "text-blue-400"
                    )}
                  >
                    {typeof line.content === "string" &&
                    line.content.includes("\x1b[")
                      ? parseAnsiContent(line.content)
                      : line.content}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input */}
          {allowInput && (
            <>
              <Separator />
              <form onSubmit={handleInputSubmit} className="p-4">
                <div className="flex items-center gap-2 font-mono">
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-shrink-0">{prompt}</span>
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 border-0 bg-transparent p-0 focus-visible:ring-0 font-mono"
                    placeholder="Enter command..."
                    autoComplete="off"
                    autoFocus
                  />
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    )
  }
)

CodeTerminal.displayName = "CodeTerminal"

export { CodeTerminal, codeTerminalVariants, type TerminalLine }
