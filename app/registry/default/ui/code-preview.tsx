"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  EyeOff,
  Play,
  RefreshCw,
  Settings,
  Square,
  Terminal,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import { CodeSnippet } from "@/registry/default/ui/code-snippet"
import { Separator } from "@/registry/default/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/registry/default/ui/tabs"
import { Toggle } from "@/registry/default/ui/toggle"

const codePreviewVariants = cva(
  "relative overflow-hidden rounded-lg border bg-background",
  {
    variants: {
      size: {
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface PreviewFile {
  filename: string
  content: string
  language: string
  type: "html" | "css" | "js" | "jsx" | "ts" | "tsx"
}

export interface PreviewResult {
  type: "output" | "error" | "log"
  content: string
  timestamp: number
}

export interface CodePreviewProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof codePreviewVariants> {
  files: PreviewFile[]
  defaultFile?: string
  showPreview?: boolean
  showConsole?: boolean
  autoRun?: boolean
  maxHeight?: string
  previewHeight?: string
  consoleHeight?: string
  allowFullscreen?: boolean
  customRunner?: (files: PreviewFile[]) => Promise<string>
}

// Simple HTML/CSS/JS runner
const runHTMLCode = (files: PreviewFile[]): string => {
  const htmlFile = files.find((f) => f.type === "html")
  const cssFiles = files.filter((f) => f.type === "css")
  const jsFiles = files.filter((f) => f.type === "js")

  let html = htmlFile?.content || "<div>No HTML file provided</div>"

  // Inject CSS
  if (cssFiles.length > 0) {
    const cssContent = cssFiles.map((f) => f.content).join("\n")
    html = `<style>${cssContent}</style>\n${html}`
  }

  // Inject JS
  if (jsFiles.length > 0) {
    const jsContent = jsFiles.map((f) => f.content).join("\n")
    html = `${html}\n<script>${jsContent}</script>`
  }

  return html
}

// Console capture script
const consoleScript = `
<script>
  const originalConsole = window.console;
  const logs = [];

  ['log', 'warn', 'error', 'info'].forEach(method => {
    window.console[method] = function(...args) {
      logs.push({
        type: method,
        content: args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '),
        timestamp: Date.now()
      });

      // Also call original console method
      originalConsole[method].apply(originalConsole, arguments);

      // Send to parent
      window.parent.postMessage({
        type: 'console',
        data: logs[logs.length - 1]
      }, '*');
    };
  });

  window.addEventListener('error', (e) => {
    window.parent.postMessage({
      type: 'error',
      data: {
        type: 'error',
        content: e.message + ' at ' + e.filename + ':' + e.lineno,
        timestamp: Date.now()
      }
    }, '*');
  });
</script>
`

const CodePreview = React.forwardRef<HTMLDivElement, CodePreviewProps>(
  (
    {
      className,
      size,
      files,
      defaultFile,
      showPreview = true,
      showConsole = true,
      autoRun = false,
      maxHeight = "600px",
      previewHeight = "300px",
      consoleHeight = "150px",
      allowFullscreen = true,
      customRunner,
      ...props
    },
    ref
  ) => {
    const [activeFile, setActiveFile] = React.useState(
      defaultFile || files[0]?.filename || ""
    )
    const [previewContent, setPreviewContent] = React.useState("")
    const [isRunning, setIsRunning] = React.useState(false)
    const [results, setResults] = React.useState<PreviewResult[]>([])
    const [isPreviewVisible, setIsPreviewVisible] = React.useState(showPreview)
    const [isConsoleVisible, setIsConsoleVisible] = React.useState(showConsole)
    const [isFullscreen, setIsFullscreen] = React.useState(false)
    const [copied, setCopied] = React.useState<Record<string, boolean>>({})

    const iframeRef = React.useRef<HTMLIFrameElement>(null)

    const currentFile = files.find((f) => f.filename === activeFile) || files[0]

    // Handle messages from iframe
    React.useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "console" || event.data?.type === "error") {
          setResults((prev) => [...prev, event.data.data])
        }
      }

      window.addEventListener("message", handleMessage)
      return () => window.removeEventListener("message", handleMessage)
    }, [])

    const runCode = React.useCallback(async () => {
      setIsRunning(true)
      setResults([])

      try {
        let output: string

        if (customRunner) {
          output = await customRunner(files)
        } else {
          output = runHTMLCode(files)
        }

        // Add console capture
        output = consoleScript + output

        setPreviewContent(output)

        // Update iframe
        if (iframeRef.current) {
          const doc = iframeRef.current.contentDocument
          if (doc) {
            doc.open()
            doc.write(output)
            doc.close()
          }
        }
      } catch (error) {
        setResults([
          {
            type: "error",
            content: error instanceof Error ? error.message : String(error),
            timestamp: Date.now(),
          },
        ])
      } finally {
        setIsRunning(false)
      }
    }, [files, customRunner])

    // Auto-run on file changes
    React.useEffect(() => {
      if (autoRun) {
        const timer = setTimeout(runCode, 1000)
        return () => clearTimeout(timer)
      }
    }, [files, autoRun, runCode])

    const copyFileContent = React.useCallback(
      async (filename: string) => {
        const file = files.find((f) => f.filename === filename)
        if (!file) return

        try {
          await navigator.clipboard.writeText(file.content)
          setCopied((prev) => ({ ...prev, [filename]: true }))
          setTimeout(() => {
            setCopied((prev) => ({ ...prev, [filename]: false }))
          }, 2000)
        } catch (error) {
          console.error("Failed to copy code:", error)
        }
      },
      [files]
    )

    const clearConsole = () => {
      setResults([])
    }

    const renderConsole = () => (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/30">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            <span className="text-sm font-medium">Console</span>
            {results.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {results.length}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearConsole}
            className="h-8 w-8 p-0"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-1 font-mono text-xs">
          {results.length === 0 ? (
            <div className="text-muted-foreground italic">No output</div>
          ) : (
            results.map((result, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-2 p-2 rounded",
                  result.type === "error" &&
                    "bg-red-500/10 text-red-600 dark:text-red-400",
                  result.type === "log" &&
                    "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                  result.type === "output" &&
                    "bg-green-500/10 text-green-600 dark:text-green-400"
                )}
              >
                <span className="text-xs text-muted-foreground">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </span>
                <pre className="flex-1 whitespace-pre-wrap break-words">
                  {result.content}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    )

    const layout = isFullscreen ? "fixed inset-0 z-50 bg-background" : ""

    return (
      <div
        ref={ref}
        className={cn(codePreviewVariants({ size }), layout, className)}
        style={{ maxHeight: isFullscreen ? "100vh" : maxHeight }}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-2">
          <Tabs
            value={activeFile}
            onValueChange={setActiveFile}
            className="flex-1"
          >
            <TabsList className="h-auto p-0 bg-transparent">
              {files.map((file) => (
                <TabsTrigger
                  key={file.filename}
                  value={file.filename}
                  className="relative flex items-center gap-2 data-[state=active]:bg-muted"
                >
                  <span>{file.filename}</span>
                  <Badge variant="outline" className="text-xs">
                    {file.language}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      copyFileContent(file.filename)
                    }}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  >
                    {copied[file.filename] ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Toggle
              pressed={isPreviewVisible}
              onPressedChange={setIsPreviewVisible}
              aria-label="Toggle preview"
              size="sm"
            >
              {isPreviewVisible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Toggle>

            <Toggle
              pressed={isConsoleVisible}
              onPressedChange={setIsConsoleVisible}
              aria-label="Toggle console"
              size="sm"
            >
              <Terminal className="h-4 w-4" />
            </Toggle>

            <Button
              variant="outline"
              size="sm"
              onClick={runCode}
              disabled={isRunning}
              className="gap-2"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Run
            </Button>

            {allowFullscreen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="h-8 w-8 p-0"
              >
                {isFullscreen ? (
                  <Square className="h-4 w-4" />
                ) : (
                  <Settings className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full">
          {/* Code Editor */}
          <div className="flex-1 min-h-0">
            <Tabs value={activeFile} onValueChange={setActiveFile}>
              {files.map((file) => (
                <TabsContent
                  key={file.filename}
                  value={file.filename}
                  className="m-0 h-full"
                >
                  <CodeSnippet
                    code={file.content}
                    language={file.language}
                    showLineNumbers
                    showCopyButton={false}
                    showHeader={false}
                    maxHeight="100%"
                    className="border-0 rounded-none"
                  />
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Preview and Console */}
          {(isPreviewVisible || isConsoleVisible) && (
            <>
              <Separator />
              <div className="flex flex-col lg:flex-row min-h-0">
                {/* Preview */}
                {isPreviewVisible && (
                  <div
                    className="flex-1 min-h-0 border-r last:border-r-0"
                    style={{ height: previewHeight }}
                  >
                    <div className="flex items-center gap-2 border-b px-4 py-2 bg-muted/30">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm font-medium">Preview</span>
                      {results.filter((r) => r.type === "error").length > 0 && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <iframe
                      ref={iframeRef}
                      className="w-full h-full bg-white"
                      sandbox="allow-scripts allow-same-origin"
                      srcDoc={previewContent}
                    />
                  </div>
                )}

                {/* Console */}
                {isConsoleVisible && (
                  <div
                    className="flex-1 min-h-0"
                    style={{ height: consoleHeight }}
                  >
                    {renderConsole()}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Fullscreen overlay */}
        {isFullscreen && (
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsFullscreen(false)}
          />
        )}
      </div>
    )
  }
)

CodePreview.displayName = "CodePreview"

export { CodePreview, codePreviewVariants }
