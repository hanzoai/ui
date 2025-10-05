"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"

interface Command {
  id: string
  input: string
  output: string | React.ReactNode
  timestamp: Date
  type?: "command" | "error" | "success" | "info"
}

interface TerminalProps extends React.HTMLAttributes<HTMLDivElement> {
  prompt?: string
  initialCommands?: Command[]
  onCommand?: (
    command: string
  ) => Promise<string | React.ReactNode> | string | React.ReactNode
  theme?: "dark" | "light" | "matrix" | "dracula"
  enableHistory?: boolean
  enableAutoComplete?: boolean
  autoCompleteCommands?: string[]
  maxHistorySize?: number
}

const themes = {
  dark: {
    background: "bg-gray-900",
    text: "text-gray-100",
    prompt: "text-green-400",
    input: "text-white",
    output: "text-gray-300",
    error: "text-red-400",
    success: "text-green-400",
    info: "text-blue-400",
    border: "border-gray-800",
    selection: "selection:bg-gray-700",
  },
  light: {
    background: "bg-white",
    text: "text-gray-900",
    prompt: "text-blue-600",
    input: "text-gray-900",
    output: "text-gray-700",
    error: "text-red-600",
    success: "text-green-600",
    info: "text-blue-600",
    border: "border-gray-200",
    selection: "selection:bg-blue-100",
  },
  matrix: {
    background: "bg-black",
    text: "text-green-400",
    prompt: "text-green-500",
    input: "text-green-300",
    output: "text-green-400",
    error: "text-red-500",
    success: "text-lime-400",
    info: "text-cyan-400",
    border: "border-green-900",
    selection: "selection:bg-green-900",
  },
  dracula: {
    background: "bg-[#282a36]",
    text: "text-[#f8f8f2]",
    prompt: "text-[#50fa7b]",
    input: "text-[#f8f8f2]",
    output: "text-[#6272a4]",
    error: "text-[#ff5555]",
    success: "text-[#50fa7b]",
    info: "text-[#8be9fd]",
    border: "border-[#44475a]",
    selection: "selection:bg-[#44475a]",
  },
}

const highlightSyntax = (text: string): React.ReactNode => {
  // Simple syntax highlighting for common patterns
  const patterns = [
    { regex: /(".*?"|'.*?')/g, className: "text-yellow-400" }, // strings
    { regex: /\b(true|false|null|undefined)\b/g, className: "text-orange-400" }, // keywords
    { regex: /\b(\d+)\b/g, className: "text-purple-400" }, // numbers
    {
      regex: /\b(function|const|let|var|if|else|for|while|return)\b/g,
      className: "text-pink-400",
    }, // js keywords
    { regex: /(--?\w+)/g, className: "text-cyan-400" }, // flags
  ]

  let highlighted = text
  patterns.forEach(({ regex, className }) => {
    highlighted = highlighted.replace(
      regex,
      `<span class="${className}">$1</span>`
    )
  })

  return <span dangerouslySetInnerHTML={{ __html: highlighted }} />
}

export function Terminal({
  prompt = "$",
  initialCommands = [],
  onCommand,
  theme = "dark",
  enableHistory = true,
  enableAutoComplete = true,
  autoCompleteCommands = [
    "help",
    "clear",
    "exit",
    "ls",
    "cd",
    "pwd",
    "echo",
    "date",
    "whoami",
  ],
  maxHistorySize = 50,
  className,
  ...props
}: TerminalProps) {
  const [commands, setCommands] = React.useState<Command[]>(initialCommands)
  const [currentInput, setCurrentInput] = React.useState("")
  const [historyIndex, setHistoryIndex] = React.useState(-1)
  const [commandHistory, setCommandHistory] = React.useState<string[]>([])
  const [suggestions, setSuggestions] = React.useState<string[]>([])
  const [suggestionIndex, setSuggestionIndex] = React.useState(0)
  const [copied, setCopied] = React.useState<string | null>(null)

  const terminalRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const currentTheme = themes[theme]

  React.useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [commands])

  React.useEffect(() => {
    if (enableAutoComplete && currentInput) {
      const matches = autoCompleteCommands.filter((cmd) =>
        cmd.toLowerCase().startsWith(currentInput.toLowerCase())
      )
      setSuggestions(matches)
      setSuggestionIndex(0)
    } else {
      setSuggestions([])
    }
  }, [currentInput, enableAutoComplete, autoCompleteCommands])

  const handleCommand = async (input: string) => {
    if (!input.trim()) return

    const newCommand: Command = {
      id: Date.now().toString(),
      input,
      output: "",
      timestamp: new Date(),
      type: "command",
    }

    // Built-in commands
    if (input.toLowerCase() === "clear") {
      setCommands([])
      setCurrentInput("")
      return
    }

    if (input.toLowerCase() === "help") {
      newCommand.output = (
        <div className="space-y-1">
          <div>Available commands:</div>
          <div className="ml-4 space-y-1">
            <div>• clear - Clear the terminal</div>
            <div>• help - Show this help message</div>
            <div>• date - Show current date and time</div>
            <div>• echo [text] - Print text to terminal</div>
            {autoCompleteCommands.map((cmd) => (
              <div key={cmd}>• {cmd}</div>
            ))}
          </div>
        </div>
      )
      newCommand.type = "info"
    } else if (input.toLowerCase() === "date") {
      newCommand.output = new Date().toString()
      newCommand.type = "success"
    } else if (input.toLowerCase().startsWith("echo ")) {
      newCommand.output = input.substring(5)
      newCommand.type = "success"
    } else if (onCommand) {
      try {
        const result = await onCommand(input)
        newCommand.output = result
        newCommand.type = "success"
      } catch (error) {
        newCommand.output = `Error: ${error instanceof Error ? error.message : String(error)}`
        newCommand.type = "error"
      }
    } else {
      newCommand.output = `Command not found: ${input}`
      newCommand.type = "error"
    }

    setCommands((prev) => [...prev, newCommand])

    if (enableHistory) {
      setCommandHistory((prev) => {
        const updated = [input, ...prev.filter((cmd) => cmd !== input)]
        return updated.slice(0, maxHistorySize)
      })
    }

    setCurrentInput("")
    setHistoryIndex(-1)
    setSuggestions([])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleCommand(currentInput)
    } else if (e.key === "ArrowUp" && enableHistory) {
      e.preventDefault()
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setCurrentInput(commandHistory[newIndex])
      }
    } else if (e.key === "ArrowDown" && enableHistory) {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setCurrentInput(commandHistory[newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setCurrentInput("")
      }
    } else if (e.key === "Tab" && suggestions.length > 0) {
      e.preventDefault()
      const suggestion = suggestions[suggestionIndex]
      if (suggestion) {
        setCurrentInput(suggestion)
        setSuggestions([])
      }
    } else if (e.key === "Escape") {
      setSuggestions([])
      setSuggestionIndex(0)
    }
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setCurrentInput((prev) => prev + text)
      inputRef.current?.focus()
    } catch (err) {
      console.error("Failed to paste:", err)
    }
  }

  return (
    <div
      ref={terminalRef}
      className={cn(
        "relative rounded-lg border p-4 font-mono text-sm overflow-auto",
        currentTheme.background,
        currentTheme.text,
        currentTheme.border,
        currentTheme.selection,
        className
      )}
      onClick={() => inputRef.current?.focus()}
      onPaste={handlePaste}
      {...props}
    >
      {/* Terminal header */}
      <div className="mb-4 flex items-center space-x-2">
        <div className="h-3 w-3 rounded-full bg-red-500" />
        <div className="h-3 w-3 rounded-full bg-yellow-500" />
        <div className="h-3 w-3 rounded-full bg-green-500" />
        <span className="ml-2 text-xs opacity-50">terminal</span>
      </div>

      {/* Command history */}
      <div className="space-y-2">
        {commands.map((cmd) => (
          <div key={cmd.id} className="group relative">
            <div className="flex items-start space-x-2">
              <span className={currentTheme.prompt}>{prompt}</span>
              <span className={currentTheme.input}>
                {highlightSyntax(cmd.input)}
              </span>
              <button
                onClick={() => handleCopy(cmd.input)}
                className="invisible group-hover:visible ml-auto opacity-50 hover:opacity-100"
                aria-label="Copy command"
              >
                {copied === cmd.input ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
            {cmd.output && (
              <div
                className={cn(
                  "mt-1 pl-4",
                  cmd.type === "error" && currentTheme.error,
                  cmd.type === "success" && currentTheme.success,
                  cmd.type === "info" && currentTheme.info,
                  (!cmd.type || cmd.type === "command") && currentTheme.output
                )}
              >
                {typeof cmd.output === "string"
                  ? highlightSyntax(cmd.output)
                  : cmd.output}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Current input line */}
      <div className="relative mt-2">
        <div className="flex items-center space-x-2">
          <span className={currentTheme.prompt}>{prompt}</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "flex-1 bg-transparent outline-none",
              currentTheme.input
            )}
            spellCheck={false}
            autoComplete="off"
            aria-label="Terminal input"
          />
        </div>

        {/* Autocomplete suggestions */}
        {suggestions.length > 0 && (
          <div
            className={cn(
              "absolute left-0 top-full mt-1 rounded-md border p-1 shadow-lg z-10",
              currentTheme.background,
              currentTheme.border
            )}
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion}
                className={cn(
                  "rounded px-2 py-1 cursor-pointer",
                  index === suggestionIndex
                    ? "bg-gray-700"
                    : "hover:bg-gray-800",
                  currentTheme.text
                )}
                onClick={() => {
                  setCurrentInput(suggestion)
                  setSuggestions([])
                  inputRef.current?.focus()
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
