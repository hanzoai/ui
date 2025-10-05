"use client"

import * as React from "react"
import Editor, { OnChange, OnMount } from "@monaco-editor/react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  AlertTriangle,
  Bot,
  Bug,
  Check,
  ChevronDown,
  ChevronRight,
  Code,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileCode,
  FileText,
  GitCompare,
  Loader2,
  MessageSquare,
  Play,
  RotateCcw,
  Send,
  Settings,
  Shield,
  Split,
  TestTube,
  Upload,
  User,
  Wand2,
  Zap,
} from "lucide-react"
import { useTheme } from "next-themes"

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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/default/ui/dropdown-menu"
import { Progress } from "@/registry/default/ui/progress"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/registry/default/ui/resizable"
import { ScrollArea } from "@/registry/default/ui/scroll-area"
import { Separator } from "@/registry/default/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/registry/default/ui/tabs"
import { Textarea } from "@/registry/default/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/registry/default/ui/tooltip"

// Types
export type CodeFeature =
  | "generate"
  | "explain"
  | "refactor"
  | "debug"
  | "test"
  | "document"
  | "review"

export interface Explanation {
  id: string
  line: number
  content: string
  type: "explanation" | "suggestion" | "warning" | "error"
}

export interface CodeSuggestion {
  id: string
  type: CodeFeature
  title: string
  description: string
  code?: string
  startLine?: number
  endLine?: number
  severity?: "info" | "warning" | "error"
}

export interface SecurityIssue {
  id: string
  line: number
  severity: "low" | "medium" | "high" | "critical"
  message: string
  fix?: string
}

export interface AICodeProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  defaultValue?: string
  language?: string
  theme?: "dark" | "light" | "auto"
  height?: string | number
  onGenerate?: (prompt: string) => Promise<string>
  onExplain?: (code: string, line?: number) => Promise<Explanation[]>
  onRefactor?: (code: string) => Promise<string>
  onDebug?: (code: string) => Promise<CodeSuggestion[]>
  onTest?: (code: string) => Promise<string>
  onDocument?: (code: string) => Promise<string>
  onReview?: (code: string) => Promise<CodeSuggestion[]>
  onSecurityScan?: (code: string) => Promise<SecurityIssue[]>
  onChange?: (value: string) => void
  features?: CodeFeature[]
  showMinimap?: boolean
  showLineNumbers?: boolean
  isGenerating?: boolean
  multiFileSupport?: boolean
  files?: { name: string; content: string; language?: string }[]
  activeFile?: string
  onFileChange?: (fileName: string) => void
  onFileCreate?: (fileName: string, content: string) => void
  placeholder?: string
}

// Component variants
const suggestionVariants = cva(
  "relative rounded-lg border p-3 transition-colors",
  {
    variants: {
      severity: {
        info: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
        warning:
          "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950",
        error: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
      },
    },
    defaultVariants: {
      severity: "info",
    },
  }
)

// AI Chat Message for prompts
interface AIMessage {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  type?: "prompt" | "code" | "explanation"
}

// Feature icons mapping
const featureIcons = {
  generate: Wand2,
  explain: Eye,
  refactor: Code,
  debug: Bug,
  test: TestTube,
  document: FileText,
  review: GitCompare,
}

// Language detection patterns
const languagePatterns = {
  typescript: /\.(tsx?|ts)$/,
  javascript: /\.(jsx?|js|mjs)$/,
  python: /\.py$/,
  java: /\.java$/,
  csharp: /\.cs$/,
  cpp: /\.(cpp|cc|cxx)$/,
  c: /\.c$/,
  go: /\.go$/,
  rust: /\.rs$/,
  php: /\.php$/,
  ruby: /\.rb$/,
  swift: /\.swift$/,
}

// Security scanner component
const SecurityPanel = React.forwardRef<
  HTMLDivElement,
  {
    issues: SecurityIssue[]
    onFixIssue?: (issue: SecurityIssue) => void
  } & React.HTMLAttributes<HTMLDivElement>
>(({ issues, onFixIssue, className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-2", className)} {...props}>
    <div className="flex items-center gap-2">
      <Shield className="h-4 w-4" />
      <span className="font-medium">Security Analysis</span>
      {issues.length > 0 && (
        <Badge
          variant={
            issues.some((i) => i.severity === "critical")
              ? "destructive"
              : "secondary"
          }
        >
          {issues.length} issue{issues.length !== 1 ? "s" : ""}
        </Badge>
      )}
    </div>
    {issues.length === 0 ? (
      <p className="text-sm text-muted-foreground">
        No security issues detected
      </p>
    ) : (
      <div className="space-y-2">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className={cn(
              "rounded-lg border p-3 text-sm",
              issue.severity === "critical" &&
                "border-red-500 bg-red-50 dark:bg-red-950",
              issue.severity === "high" &&
                "border-orange-500 bg-orange-50 dark:bg-orange-950",
              issue.severity === "medium" &&
                "border-yellow-500 bg-yellow-50 dark:bg-yellow-950",
              issue.severity === "low" &&
                "border-blue-500 bg-blue-50 dark:bg-blue-950"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      issue.severity === "critical" || issue.severity === "high"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {issue.severity.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Line {issue.line}
                  </span>
                </div>
                <p>{issue.message}</p>
                {issue.fix && (
                  <p className="text-xs text-muted-foreground">
                    Fix: {issue.fix}
                  </p>
                )}
              </div>
              {onFixIssue && issue.fix && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onFixIssue(issue)}
                >
                  Fix
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
))
SecurityPanel.displayName = "SecurityPanel"

// Suggestions panel component
const SuggestionsPanel = React.forwardRef<
  HTMLDivElement,
  {
    suggestions: CodeSuggestion[]
    onApplySuggestion?: (suggestion: CodeSuggestion) => void
  } & React.HTMLAttributes<HTMLDivElement>
>(({ suggestions, onApplySuggestion, className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-2", className)} {...props}>
    <div className="flex items-center gap-2">
      <Zap className="h-4 w-4" />
      <span className="font-medium">AI Suggestions</span>
    </div>
    {suggestions.length === 0 ? (
      <p className="text-sm text-muted-foreground">No suggestions available</p>
    ) : (
      <div className="space-y-2">
        {suggestions.map((suggestion) => {
          const Icon = featureIcons[suggestion.type] || Code
          return (
            <div
              key={suggestion.id}
              className={cn(
                suggestionVariants({ severity: suggestion.severity || "info" }),
                "space-y-2"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium text-sm">
                      {suggestion.title}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {suggestion.description}
                  </p>
                  {suggestion.startLine && suggestion.endLine && (
                    <span className="text-xs text-muted-foreground">
                      Lines {suggestion.startLine}-{suggestion.endLine}
                    </span>
                  )}
                </div>
                {onApplySuggestion && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onApplySuggestion(suggestion)}
                  >
                    Apply
                  </Button>
                )}
              </div>
              {suggestion.code && (
                <div className="mt-2 rounded bg-background/50 p-2">
                  <pre className="text-xs overflow-x-auto">
                    <code>{suggestion.code}</code>
                  </pre>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )}
  </div>
))
SuggestionsPanel.displayName = "SuggestionsPanel"

// Chat panel for AI interaction
const ChatPanel = React.forwardRef<
  HTMLDivElement,
  {
    messages: AIMessage[]
    onSendMessage: (message: string) => void
    isGenerating?: boolean
    placeholder?: string
  } & React.HTMLAttributes<HTMLDivElement>
>(
  (
    {
      messages,
      onSendMessage,
      isGenerating,
      placeholder = "Ask AI about your code...",
      className,
      ...props
    },
    ref
  ) => {
    const [input, setInput] = React.useState("")
    const scrollRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, [messages])

    const handleSend = () => {
      if (!input.trim() || isGenerating) return
      onSendMessage(input)
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
        className={cn("flex h-full flex-col", className)}
        {...props}
      >
        <div className="flex items-center gap-2 p-3 border-b">
          <MessageSquare className="h-4 w-4" />
          <span className="font-medium">AI Assistant</span>
        </div>

        <ScrollArea ref={scrollRef} className="flex-1 p-3">
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback>
                      <Bot className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.type === "code" ? (
                    <pre className="overflow-x-auto">
                      <code>{message.content}</code>
                    </pre>
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
                {message.role === "user" && (
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback>
                      <User className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isGenerating && (
              <div className="flex gap-2 justify-start">
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarFallback>
                    <Bot className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-3">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={isGenerating}
              className="min-h-[60px] resize-none"
              rows={2}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }
)
ChatPanel.displayName = "ChatPanel"

// File tabs component for multi-file support
const FileTabs = React.forwardRef<
  HTMLDivElement,
  {
    files: { name: string; content: string; language?: string }[]
    activeFile?: string
    onFileChange?: (fileName: string) => void
    onFileCreate?: (fileName: string) => void
    onFileDelete?: (fileName: string) => void
  } & React.HTMLAttributes<HTMLDivElement>
>(
  (
    {
      files,
      activeFile,
      onFileChange,
      onFileCreate,
      onFileDelete,
      className,
      ...props
    },
    ref
  ) => {
    const [newFileName, setNewFileName] = React.useState("")
    const [isCreating, setIsCreating] = React.useState(false)

    const handleCreateFile = () => {
      if (newFileName.trim() && onFileCreate) {
        onFileCreate(newFileName.trim())
        setNewFileName("")
        setIsCreating(false)
      }
    }

    const getLanguageFromFile = (fileName: string) => {
      for (const [lang, pattern] of Object.entries(languagePatterns)) {
        if (pattern.test(fileName)) {
          return lang
        }
      }
      return "plaintext"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-1 border-b bg-muted/30 px-2",
          className
        )}
        {...props}
      >
        <ScrollArea orientation="horizontal" className="flex-1">
          <div className="flex items-center gap-1 py-1">
            {files.map((file) => (
              <Button
                key={file.name}
                variant={activeFile === file.name ? "secondary" : "ghost"}
                size="sm"
                className="h-8 gap-2 rounded-t-md rounded-b-none"
                onClick={() => onFileChange?.(file.name)}
              >
                <FileCode className="h-3 w-3" />
                <span className="text-xs">{file.name}</span>
                {onFileDelete && files.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      onFileDelete(file.name)
                    }}
                  >
                    ×
                  </Button>
                )}
              </Button>
            ))}
          </div>
        </ScrollArea>

        {onFileCreate && (
          <div className="flex items-center gap-1">
            {isCreating ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="filename.ext"
                  className="h-6 w-24 rounded border px-2 text-xs"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleCreateFile()
                    if (e.key === "Escape") setIsCreating(false)
                  }}
                  autoFocus
                />
                <Button
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleCreateFile}
                >
                  <Check className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsCreating(true)}
              >
                +
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }
)
FileTabs.displayName = "FileTabs"

// Main AI Code component
const AICode = React.forwardRef<HTMLDivElement, AICodeProps>(
  (
    {
      value,
      defaultValue = "",
      language = "typescript",
      theme: themeProp = "auto",
      height = "500px",
      onGenerate,
      onExplain,
      onRefactor,
      onDebug,
      onTest,
      onDocument,
      onReview,
      onSecurityScan,
      onChange,
      features = [
        "generate",
        "explain",
        "refactor",
        "debug",
        "test",
        "document",
        "review",
      ],
      showMinimap = false,
      showLineNumbers = true,
      isGenerating = false,
      multiFileSupport = false,
      files = [{ name: "main.ts", content: defaultValue, language }],
      activeFile,
      onFileChange,
      onFileCreate,
      placeholder = "Ask AI to generate code or explain existing code...",
      className,
      ...props
    },
    ref
  ) => {
    const { theme: systemTheme } = useTheme()
    const [editorValue, setEditorValue] = React.useState(value || defaultValue)
    const [currentLanguage, setCurrentLanguage] = React.useState(language)
    const [explanations, setExplanations] = React.useState<Explanation[]>([])
    const [suggestions, setSuggestions] = React.useState<CodeSuggestion[]>([])
    const [securityIssues, setSecurityIssues] = React.useState<SecurityIssue[]>(
      []
    )
    const [messages, setMessages] = React.useState<AIMessage[]>([])
    const [currentFiles, setCurrentFiles] = React.useState(files)
    const [currentActiveFile, setCurrentActiveFile] = React.useState(
      activeFile || files[0]?.name
    )
    const [showSidePanel, setShowSidePanel] = React.useState(true)
    const [sidePanelTab, setSidePanelTab] = React.useState<
      "chat" | "suggestions" | "security"
    >("chat")
    const [isProcessing, setIsProcessing] = React.useState(false)
    const [progress, setProgress] = React.useState(0)

    const editorRef = React.useRef<any>(null)

    // Get current file content
    const currentFile = React.useMemo(() => {
      return (
        currentFiles.find((f) => f.name === currentActiveFile) ||
        currentFiles[0]
      )
    }, [currentFiles, currentActiveFile])

    // Update editor value when file changes
    React.useEffect(() => {
      if (currentFile) {
        setEditorValue(currentFile.content)
        setCurrentLanguage(
          currentFile.language || getLanguageFromFile(currentFile.name)
        )
      }
    }, [currentFile])

    // External value changes
    React.useEffect(() => {
      if (value !== undefined) {
        setEditorValue(value)
      }
    }, [value])

    const resolveTheme = React.useMemo(() => {
      if (themeProp === "auto") {
        return systemTheme === "dark" ? "vs-dark" : "light"
      }
      return themeProp === "dark" ? "vs-dark" : "light"
    }, [themeProp, systemTheme])

    const getLanguageFromFile = React.useCallback((fileName: string) => {
      for (const [lang, pattern] of Object.entries(languagePatterns)) {
        if (pattern.test(fileName)) {
          return lang
        }
      }
      return "plaintext"
    }, [])

    // Handle editor changes
    const handleEditorChange: OnChange = React.useCallback(
      (newValue) => {
        const content = newValue || ""
        setEditorValue(content)
        onChange?.(content)

        // Update current file content
        if (multiFileSupport && currentActiveFile) {
          setCurrentFiles((prev) =>
            prev.map((f) =>
              f.name === currentActiveFile ? { ...f, content } : f
            )
          )
        }
      },
      [onChange, multiFileSupport, currentActiveFile]
    )

    // Handle editor mount
    const handleEditorMount: OnMount = React.useCallback(
      (editor, monaco) => {
        editorRef.current = editor

        // Setup hover providers for explanations
        monaco.languages.registerHoverProvider(currentLanguage, {
          provideHover: (model, position) => {
            const line = position.lineNumber
            const explanation = explanations.find((e) => e.line === line)

            if (explanation) {
              return {
                range: new monaco.Range(line, 1, line, 1),
                contents: [
                  { value: `**${explanation.type.toUpperCase()}**` },
                  { value: explanation.content },
                ],
              }
            }
            return null
          },
        })

        // Setup code actions for suggestions
        monaco.languages.registerCodeActionProvider(currentLanguage, {
          provideCodeActions: (model, range) => {
            const actions = suggestions
              .filter(
                (s) =>
                  s.startLine &&
                  s.endLine &&
                  range.startLineNumber >= s.startLine &&
                  range.endLineNumber <= s.endLine
              )
              .map((suggestion) => ({
                title: suggestion.title,
                kind: "quickfix",
                edit: suggestion.code
                  ? {
                      edits: [
                        {
                          resource: model.uri,
                          edit: {
                            range: new monaco.Range(
                              suggestion.startLine!,
                              1,
                              suggestion.endLine!,
                              model.getLineMaxColumn(suggestion.endLine!)
                            ),
                            text: suggestion.code,
                          },
                        },
                      ],
                    }
                  : undefined,
              }))

            return { actions, dispose: () => {} }
          },
        })
      },
      [currentLanguage, explanations, suggestions]
    )

    // AI feature handlers
    const handleGenerate = React.useCallback(
      async (prompt: string) => {
        if (!onGenerate) return

        setIsProcessing(true)
        setProgress(0)

        try {
          // Simulate progress
          const progressInterval = setInterval(() => {
            setProgress((prev) => Math.min(prev + 10, 90))
          }, 200)

          const newMessage: AIMessage = {
            id: Date.now().toString(),
            content: prompt,
            role: "user",
            timestamp: new Date(),
            type: "prompt",
          }
          setMessages((prev) => [...prev, newMessage])

          const generatedCode = await onGenerate(prompt)

          clearInterval(progressInterval)
          setProgress(100)

          setEditorValue(generatedCode)
          onChange?.(generatedCode)

          const responseMessage: AIMessage = {
            id: (Date.now() + 1).toString(),
            content: generatedCode,
            role: "assistant",
            timestamp: new Date(),
            type: "code",
          }
          setMessages((prev) => [...prev, responseMessage])

          // Update current file
          if (multiFileSupport && currentActiveFile) {
            setCurrentFiles((prev) =>
              prev.map((f) =>
                f.name === currentActiveFile
                  ? { ...f, content: generatedCode }
                  : f
              )
            )
          }
        } catch (error) {
          console.error("Failed to generate code:", error)
        } finally {
          setIsProcessing(false)
          setProgress(0)
        }
      },
      [onGenerate, onChange, multiFileSupport, currentActiveFile]
    )

    const handleExplain = React.useCallback(
      async (selectedLine?: number) => {
        if (!onExplain) return

        setIsProcessing(true)
        try {
          const explanationsResult = await onExplain(editorValue, selectedLine)
          setExplanations(explanationsResult)
          setSidePanelTab("suggestions")
        } catch (error) {
          console.error("Failed to explain code:", error)
        } finally {
          setIsProcessing(false)
        }
      },
      [onExplain, editorValue]
    )

    const handleFeatureAction = React.useCallback(
      async (feature: CodeFeature) => {
        if (isProcessing) return

        setIsProcessing(true)
        try {
          switch (feature) {
            case "refactor":
              if (onRefactor) {
                const refactoredCode = await onRefactor(editorValue)
                setEditorValue(refactoredCode)
                onChange?.(refactoredCode)
              }
              break

            case "debug":
              if (onDebug) {
                const debugSuggestions = await onDebug(editorValue)
                setSuggestions(debugSuggestions)
                setSidePanelTab("suggestions")
              }
              break

            case "test":
              if (onTest) {
                const testCode = await onTest(editorValue)
                // Handle test generation result
                const testMessage: AIMessage = {
                  id: Date.now().toString(),
                  content: testCode,
                  role: "assistant",
                  timestamp: new Date(),
                  type: "code",
                }
                setMessages((prev) => [...prev, testMessage])
                setSidePanelTab("chat")
              }
              break

            case "document":
              if (onDocument) {
                const documentation = await onDocument(editorValue)
                const docMessage: AIMessage = {
                  id: Date.now().toString(),
                  content: documentation,
                  role: "assistant",
                  timestamp: new Date(),
                  type: "explanation",
                }
                setMessages((prev) => [...prev, docMessage])
                setSidePanelTab("chat")
              }
              break

            case "review":
              if (onReview) {
                const reviewSuggestions = await onReview(editorValue)
                setSuggestions(reviewSuggestions)
                setSidePanelTab("suggestions")
              }
              break
          }
        } catch (error) {
          console.error(`Failed to ${feature}:`, error)
        } finally {
          setIsProcessing(false)
        }
      },
      [
        isProcessing,
        editorValue,
        onRefactor,
        onDebug,
        onTest,
        onDocument,
        onReview,
        onChange,
      ]
    )

    const handleSecurityScan = React.useCallback(async () => {
      if (!onSecurityScan) return

      setIsProcessing(true)
      try {
        const issues = await onSecurityScan(editorValue)
        setSecurityIssues(issues)
        setSidePanelTab("security")
      } catch (error) {
        console.error("Failed to scan for security issues:", error)
      } finally {
        setIsProcessing(false)
      }
    }, [onSecurityScan, editorValue])

    // File management
    const handleFileChange = React.useCallback(
      (fileName: string) => {
        setCurrentActiveFile(fileName)
        onFileChange?.(fileName)
      },
      [onFileChange]
    )

    const handleFileCreate = React.useCallback(
      (fileName: string) => {
        const newFile = {
          name: fileName,
          content: "",
          language: getLanguageFromFile(fileName),
        }
        setCurrentFiles((prev) => [...prev, newFile])
        setCurrentActiveFile(fileName)
        onFileCreate?.(fileName, "")
      },
      [getLanguageFromFile, onFileCreate]
    )

    const handleFileDelete = React.useCallback(
      (fileName: string) => {
        if (currentFiles.length <= 1) return

        setCurrentFiles((prev) => prev.filter((f) => f.name !== fileName))

        if (currentActiveFile === fileName) {
          const remainingFiles = currentFiles.filter((f) => f.name !== fileName)
          setCurrentActiveFile(remainingFiles[0]?.name)
        }
      },
      [currentFiles, currentActiveFile]
    )

    return (
      <TooltipProvider>
        <div
          ref={ref}
          className={cn(
            "flex h-full w-full flex-col overflow-hidden rounded-lg border bg-background",
            className
          )}
          {...props}
        >
          {/* Header with feature buttons */}
          <div className="flex items-center justify-between border-b bg-muted/50 p-2">
            <div className="flex items-center gap-1">
              {features.map((feature) => {
                const Icon = featureIcons[feature]
                const isActive =
                  feature === "explain" && explanations.length > 0

                return (
                  <Tooltip key={feature}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 gap-1.5 px-2"
                        onClick={() => {
                          if (feature === "explain") {
                            handleExplain()
                          } else {
                            handleFeatureAction(feature)
                          }
                        }}
                        disabled={isProcessing}
                      >
                        <Icon className="h-3 w-3" />
                        <span className="text-xs capitalize">{feature}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>AI {feature} assistance</p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}

              <Separator orientation="vertical" className="h-4" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 px-2"
                    onClick={handleSecurityScan}
                    disabled={isProcessing}
                  >
                    <Shield className="h-3 w-3" />
                    <span className="text-xs">Security</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Scan for security vulnerabilities</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-2">
              {isProcessing && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-xs text-muted-foreground">
                    Processing...
                  </span>
                  {progress > 0 && (
                    <Progress value={progress} className="w-16 h-1" />
                  )}
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => setShowSidePanel(!showSidePanel)}
              >
                {showSidePanel ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-1">
                    <Settings className="h-3 w-3" />
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem
                    checked={showMinimap}
                    onCheckedChange={(checked) => {
                      // Handle minimap toggle - would need to be passed as prop
                    }}
                  >
                    Show Minimap
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={showLineNumbers}
                    onCheckedChange={(checked) => {
                      // Handle line numbers toggle - would need to be passed as prop
                    }}
                  >
                    Show Line Numbers
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Download className="mr-2 h-3 w-3" />
                    Export Code
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Upload className="mr-2 h-3 w-3" />
                    Import Code
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* File tabs for multi-file support */}
          {multiFileSupport && (
            <FileTabs
              files={currentFiles}
              activeFile={currentActiveFile}
              onFileChange={handleFileChange}
              onFileCreate={onFileCreate ? handleFileCreate : undefined}
              onFileDelete={
                currentFiles.length > 1 ? handleFileDelete : undefined
              }
            />
          )}

          {/* Main content area */}
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {/* Code editor panel */}
            <ResizablePanel defaultSize={showSidePanel ? 70 : 100} minSize={30}>
              <div className="h-full">
                <Editor
                  height={height}
                  language={currentLanguage}
                  value={editorValue}
                  theme={resolveTheme}
                  onChange={handleEditorChange}
                  onMount={handleEditorMount}
                  options={{
                    readOnly: isGenerating || isProcessing,
                    lineNumbers: showLineNumbers ? "on" : "off",
                    minimap: { enabled: showMinimap },
                    wordWrap: "on",
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    formatOnPaste: true,
                    formatOnType: true,
                    quickSuggestions: true,
                    parameterHints: { enabled: true },
                    suggestOnTriggerCharacters: true,
                    acceptSuggestionOnEnter: "on",
                    accessibilitySupport: "auto",
                    scrollbar: {
                      vertical: "auto",
                      horizontal: "auto",
                      verticalScrollbarSize: 10,
                      horizontalScrollbarSize: 10,
                    },
                    padding: {
                      top: 16,
                      bottom: 16,
                    },
                  }}
                />
              </div>
            </ResizablePanel>

            {/* Side panel */}
            {showSidePanel && (
              <>
                <ResizableHandle />
                <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                  <Tabs
                    value={sidePanelTab}
                    onValueChange={(value) => setSidePanelTab(value as any)}
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="chat" className="text-xs">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Chat
                      </TabsTrigger>
                      <TabsTrigger value="suggestions" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        AI
                        {suggestions.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="ml-1 h-4 text-xs"
                          >
                            {suggestions.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="security" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Security
                        {securityIssues.length > 0 && (
                          <Badge
                            variant={
                              securityIssues.some(
                                (i) => i.severity === "critical"
                              )
                                ? "destructive"
                                : "secondary"
                            }
                            className="ml-1 h-4 text-xs"
                          >
                            {securityIssues.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="chat" className="h-[calc(100%-40px)]">
                      <ChatPanel
                        messages={messages}
                        onSendMessage={handleGenerate}
                        isGenerating={isGenerating || isProcessing}
                        placeholder={placeholder}
                      />
                    </TabsContent>

                    <TabsContent
                      value="suggestions"
                      className="h-[calc(100%-40px)] overflow-hidden"
                    >
                      <ScrollArea className="h-full p-3">
                        <SuggestionsPanel
                          suggestions={suggestions}
                          onApplySuggestion={(suggestion) => {
                            if (suggestion.code) {
                              setEditorValue(suggestion.code)
                              onChange?.(suggestion.code)
                            }
                          }}
                        />
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent
                      value="security"
                      className="h-[calc(100%-40px)] overflow-hidden"
                    >
                      <ScrollArea className="h-full p-3">
                        <SecurityPanel
                          issues={securityIssues}
                          onFixIssue={(issue) => {
                            if (issue.fix && editorRef.current) {
                              // Apply security fix to editor
                              const model = editorRef.current.getModel()
                              if (model) {
                                const line = model.getLineContent(issue.line)
                                const newLine = issue.fix
                                editorRef.current.executeEdits("security-fix", [
                                  {
                                    range: {
                                      startLineNumber: issue.line,
                                      startColumn: 1,
                                      endLineNumber: issue.line,
                                      endColumn: line.length + 1,
                                    },
                                    text: newLine,
                                  },
                                ])
                              }
                            }
                          }}
                        />
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      </TooltipProvider>
    )
  }
)

AICode.displayName = "AICode"

export {
  AICode,
  type AICodeProps,
  type CodeFeature,
  type Explanation,
  type CodeSuggestion,
  type SecurityIssue,
}
