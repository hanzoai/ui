"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, Copy, FileText } from "lucide-react"
import { codeToHtml } from "shiki"

import { cn } from "@/lib/utils"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import { Skeleton } from "@/registry/default/ui/skeleton"

const codeBlockVariants = cva(
  "relative overflow-hidden rounded-lg border bg-muted/50",
  {
    variants: {
      theme: {
        dark: "bg-slate-950 border-slate-800",
        light: "bg-slate-50 border-slate-200",
        github: "bg-white border-slate-200",
        "github-dark": "bg-slate-900 border-slate-700",
        "vs-dark": "bg-slate-950 border-slate-800",
        monokai: "bg-slate-900 border-slate-700",
        dracula: "bg-slate-900 border-purple-800/30",
        nord: "bg-slate-800 border-slate-600",
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

export interface CodeBlockProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof codeBlockVariants> {
  code: string
  language?: string
  filename?: string
  showLineNumbers?: boolean
  highlightLines?: number[]
  showCopyButton?: boolean
  maxHeight?: string
  diff?: {
    added?: number[]
    removed?: number[]
  }
}

interface CodeLineProps {
  line: string
  lineNumber: number
  showLineNumbers: boolean
  isHighlighted?: boolean
  isDiffAdded?: boolean
  isDiffRemoved?: boolean
}

const CodeLine = React.memo(
  ({
    line,
    lineNumber,
    showLineNumbers,
    isHighlighted = false,
    isDiffAdded = false,
    isDiffRemoved = false,
  }: CodeLineProps) => {
    return (
      <div
        className={cn(
          "group relative flex min-h-[1.5rem] items-center px-4 py-0.5",
          isHighlighted && "bg-blue-500/10 border-l-2 border-l-blue-500",
          isDiffAdded && "bg-green-500/10 border-l-2 border-l-green-500",
          isDiffRemoved && "bg-red-500/10 border-l-2 border-l-red-500"
        )}
      >
        {showLineNumbers && (
          <span className="mr-4 inline-block w-8 select-none text-right text-xs text-muted-foreground">
            {lineNumber}
          </span>
        )}
        {(isDiffAdded || isDiffRemoved) && (
          <span className="mr-2 select-none text-xs">
            {isDiffAdded ? "+" : isDiffRemoved ? "-" : " "}
          </span>
        )}
        <div
          className="flex-1 overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: line }}
        />
      </div>
    )
  }
)

CodeLine.displayName = "CodeLine"

const CodeBlock = React.forwardRef<HTMLDivElement, CodeBlockProps>(
  (
    {
      className,
      theme,
      size,
      code,
      language = "text",
      filename,
      showLineNumbers = true,
      highlightLines = [],
      showCopyButton = true,
      maxHeight = "400px",
      diff,
      ...props
    },
    ref
  ) => {
    const [highlightedCode, setHighlightedCode] = React.useState<string>("")
    const [copied, setCopied] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(true)

    const themeMap = {
      dark: "github-dark",
      light: "github-light",
      github: "github-light",
      "github-dark": "github-dark",
      "vs-dark": "dark-plus",
      monokai: "monokai",
      dracula: "dracula",
      nord: "nord",
    }

    React.useEffect(() => {
      const highlightCode = async () => {
        setIsLoading(true)
        try {
          const highlighted = await codeToHtml(code, {
            lang: language,
            theme: themeMap[theme || "dark"],
            transformers: [
              {
                code(node) {
                  // Remove the outer pre and code tags since we'll handle structure ourselves
                  const codeElement = node.children.find(
                    (child) =>
                      child.type === "element" && child.tagName === "code"
                  )
                  if (codeElement) {
                    return codeElement.children
                  }
                  return node.children
                },
              },
            ],
          })

          // Extract just the inner HTML content
          const tempDiv = document.createElement("div")
          tempDiv.innerHTML = highlighted
          const codeElement = tempDiv.querySelector("code")
          setHighlightedCode(codeElement?.innerHTML || highlighted)
        } catch (error) {
          console.error("Failed to highlight code:", error)
          setHighlightedCode(code)
        } finally {
          setIsLoading(false)
        }
      }

      highlightCode()
    }, [code, language, theme])

    const copyToClipboard = React.useCallback(async () => {
      try {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error("Failed to copy code:", error)
      }
    }, [code])

    const lines = highlightedCode
      .split("\n")
      .filter((line) => line.trim() !== "")

    return (
      <div
        ref={ref}
        className={cn(codeBlockVariants({ theme, size, className }))}
        {...props}
      >
        {/* Header */}
        {(filename || language || showCopyButton) && (
          <div className="flex items-center justify-between border-b px-4 py-2">
            <div className="flex items-center gap-2">
              {filename && (
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">{filename}</span>
                </div>
              )}
              {language && (
                <Badge variant="secondary" className="text-xs">
                  {language}
                </Badge>
              )}
            </div>
            {showCopyButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-8 w-8 p-0"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span className="sr-only">
                  {copied ? "Copied" : "Copy code"}
                </span>
              </Button>
            )}
          </div>
        )}

        {/* Code Content */}
        <div className="overflow-auto" style={{ maxHeight }}>
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  {showLineNumbers && <Skeleton className="h-4 w-8" />}
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          ) : (
            <div className="font-mono">
              {lines.map((line, index) => {
                const lineNumber = index + 1
                const isHighlighted = highlightLines.includes(lineNumber)
                const isDiffAdded = diff?.added?.includes(lineNumber)
                const isDiffRemoved = diff?.removed?.includes(lineNumber)

                return (
                  <CodeLine
                    key={index}
                    line={line}
                    lineNumber={lineNumber}
                    showLineNumbers={showLineNumbers}
                    isHighlighted={isHighlighted}
                    isDiffAdded={isDiffAdded}
                    isDiffRemoved={isDiffRemoved}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }
)

CodeBlock.displayName = "CodeBlock"

export { CodeBlock, codeBlockVariants }
