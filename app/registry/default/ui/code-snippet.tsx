"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, Copy, FileText, Maximize2, Minimize2 } from "lucide-react"
import { codeToHtml } from "shiki"

import { cn } from "@/lib/utils"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import { Skeleton } from "@/registry/default/ui/skeleton"

const codeSnippetVariants = cva("relative group", {
  variants: {
    variant: {
      default: "rounded-lg border bg-muted/50",
      inline: "inline-block rounded-md bg-muted px-2 py-1",
      minimal: "bg-transparent",
    },
    theme: {
      dark: "bg-slate-950 border-slate-800",
      light: "bg-slate-50 border-slate-200",
      github: "bg-white border-slate-200",
      "github-dark": "bg-slate-900 border-slate-700",
      terminal: "bg-black border-green-500/30 text-green-400",
      retro: "bg-amber-50 border-amber-200 text-amber-900",
    },
    size: {
      xs: "text-xs",
      sm: "text-sm",
      default: "text-sm",
      lg: "text-base",
    },
  },
  defaultVariants: {
    variant: "default",
    theme: "dark",
    size: "default",
  },
})

export interface CodeSnippetProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof codeSnippetVariants> {
  code: string
  language?: string
  filename?: string
  showLineNumbers?: boolean
  highlightLines?: number[]
  showCopyButton?: boolean
  showLanguageBadge?: boolean
  showHeader?: boolean
  maxHeight?: string
  expandable?: boolean
  collapsedHeight?: string
  wrapLines?: boolean
  startLineNumber?: number
}

const CodeSnippet = React.forwardRef<HTMLDivElement, CodeSnippetProps>(
  (
    {
      className,
      variant,
      theme,
      size,
      code,
      language = "text",
      filename,
      showLineNumbers = false,
      highlightLines = [],
      showCopyButton = true,
      showLanguageBadge = true,
      showHeader = true,
      maxHeight,
      expandable = false,
      collapsedHeight = "200px",
      wrapLines = false,
      startLineNumber = 1,
      ...props
    },
    ref
  ) => {
    const [highlightedCode, setHighlightedCode] = React.useState<string>("")
    const [copied, setCopied] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(true)
    const [isExpanded, setIsExpanded] = React.useState(!expandable)

    const themeMap = {
      dark: "github-dark",
      light: "github-light",
      github: "github-light",
      "github-dark": "github-dark",
      terminal: "github-dark",
      retro: "github-light",
    }

    React.useEffect(() => {
      const highlightCode = async () => {
        setIsLoading(true)
        try {
          const highlighted = await codeToHtml(code, {
            lang: language,
            theme: themeMap[theme || "dark"],
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

    const lines = highlightedCode.split("\n").filter((line, index, array) => {
      // Keep empty lines except for the last one if it's empty
      return line.trim() !== "" || index < array.length - 1
    })

    const renderInline = () => (
      <code
        className={cn(
          codeSnippetVariants({ variant, theme, size }),
          "font-mono",
          className
        )}
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
    )

    const renderBlock = () => (
      <div
        ref={ref}
        className={cn(
          codeSnippetVariants({ variant, theme, size }),
          "overflow-hidden",
          className
        )}
        {...props}
      >
        {/* Header */}
        {showHeader &&
          (filename || language || showCopyButton || expandable) && (
            <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/30">
              <div className="flex items-center gap-2">
                {filename && (
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{filename}</span>
                  </div>
                )}
                {showLanguageBadge && language && (
                  <Badge variant="secondary" className="text-xs">
                    {language}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {expandable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-8 w-8 p-0"
                  >
                    {isExpanded ? (
                      <Minimize2 className="h-3.5 w-3.5" />
                    ) : (
                      <Maximize2 className="h-3.5 w-3.5" />
                    )}
                    <span className="sr-only">
                      {isExpanded ? "Collapse" : "Expand"}
                    </span>
                  </Button>
                )}
                {showCopyButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyToClipboard}
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
            </div>
          )}

        {/* Content */}
        <div
          className={cn("overflow-auto", !wrapLines && "overflow-x-auto")}
          style={{
            maxHeight: isExpanded ? maxHeight : collapsedHeight,
          }}
        >
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: Math.min(lines.length || 5, 10) }).map(
                (_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    {showLineNumbers && <Skeleton className="h-4 w-8" />}
                    <Skeleton className="h-4 flex-1" />
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="font-mono">
              {lines.map((line, index) => {
                const lineNumber = index + startLineNumber
                const isHighlighted = highlightLines.includes(lineNumber)

                return (
                  <div
                    key={index}
                    className={cn(
                      "group relative flex min-h-[1.5rem] items-center px-4 py-0.5",
                      isHighlighted &&
                        "bg-blue-500/10 border-l-2 border-l-blue-500",
                      !wrapLines && "whitespace-nowrap"
                    )}
                  >
                    {showLineNumbers && (
                      <span className="mr-4 inline-block w-8 select-none text-right text-xs text-muted-foreground">
                        {lineNumber}
                      </span>
                    )}
                    <div
                      className={cn(
                        "flex-1",
                        wrapLines
                          ? "whitespace-pre-wrap break-words"
                          : "overflow-x-auto"
                      )}
                      dangerouslySetInnerHTML={{ __html: line }}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Expand indicator */}
        {expandable && !isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        )}

        {/* Copy button for minimal variant */}
        {variant === "minimal" && showCopyButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
      </div>
    )

    if (variant === "inline") {
      return renderInline()
    }

    return renderBlock()
  }
)

CodeSnippet.displayName = "CodeSnippet"

// Helper component for inline code
const InlineCode = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & {
    children: string
    language?: string
  }
>(({ children, language, className, ...props }, ref) => {
  return (
    <CodeSnippet
      ref={ref as any}
      code={children}
      language={language}
      variant="inline"
      showCopyButton={false}
      showLanguageBadge={false}
      showHeader={false}
      className={className}
      {...props}
    />
  )
})

InlineCode.displayName = "InlineCode"

export { CodeSnippet, InlineCode, codeSnippetVariants }
