"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  Check,
  Copy,
  GitCompare,
  Minus,
  Plus,
  SplitSquareHorizontal,
  Square,
} from "lucide-react"
import { codeToHtml } from "shiki"

import { cn } from "@/lib/utils"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import { Separator } from "@/registry/default/ui/separator"
import { Skeleton } from "@/registry/default/ui/skeleton"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/registry/default/ui/toggle-group"

const codeDiffVariants = cva(
  "relative overflow-hidden rounded-lg border bg-muted/50",
  {
    variants: {
      theme: {
        dark: "bg-slate-950 border-slate-800",
        light: "bg-slate-50 border-slate-200",
        github: "bg-white border-slate-200",
        "github-dark": "bg-slate-900 border-slate-700",
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

export interface DiffChange {
  type: "add" | "remove" | "unchanged"
  lineNumber: number
  content: string
  oldLineNumber?: number
  newLineNumber?: number
}

export interface CodeDiffProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof codeDiffVariants> {
  oldCode: string
  newCode: string
  language?: string
  filename?: string
  oldFilename?: string
  newFilename?: string
  showLineNumbers?: boolean
  showCopyButton?: boolean
  maxHeight?: string
  defaultView?: "unified" | "split"
  collapseUnchanged?: boolean
  contextLines?: number
}

interface DiffLineProps {
  change: DiffChange
  showLineNumbers: boolean
  isUnified?: boolean
  highlightedContent?: string
}

const DiffLine = React.memo(
  ({
    change,
    showLineNumbers,
    isUnified = false,
    highlightedContent,
  }: DiffLineProps) => {
    const getLineClasses = () => {
      const base = "group relative flex min-h-[1.5rem] items-center py-0.5"

      if (isUnified) {
        switch (change.type) {
          case "add":
            return cn(base, "bg-green-500/10 border-l-2 border-l-green-500")
          case "remove":
            return cn(base, "bg-red-500/10 border-l-2 border-l-red-500")
          default:
            return cn(base, "hover:bg-muted/50")
        }
      }

      return cn(base, "hover:bg-muted/50")
    }

    const getLinePrefix = () => {
      if (!isUnified) return null

      switch (change.type) {
        case "add":
          return <Plus className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
        case "remove":
          return <Minus className="h-3 w-3 text-red-500 mr-2 flex-shrink-0" />
        default:
          return <span className="w-3 mr-2 flex-shrink-0" />
      }
    }

    return (
      <div className={getLineClasses()}>
        <div className="flex items-center px-4 w-full">
          {showLineNumbers && (
            <div className="flex items-center gap-2 mr-4">
              {!isUnified ? (
                <>
                  <span className="inline-block w-8 select-none text-right text-xs text-muted-foreground">
                    {change.oldLineNumber || ""}
                  </span>
                  <span className="inline-block w-8 select-none text-right text-xs text-muted-foreground">
                    {change.newLineNumber || ""}
                  </span>
                </>
              ) : (
                <span className="inline-block w-8 select-none text-right text-xs text-muted-foreground">
                  {change.lineNumber}
                </span>
              )}
            </div>
          )}
          {getLinePrefix()}
          <div
            className="flex-1 overflow-x-auto font-mono"
            dangerouslySetInnerHTML={{
              __html: highlightedContent || change.content,
            }}
          />
        </div>
      </div>
    )
  }
)

DiffLine.displayName = "DiffLine"

// Simple diff algorithm to generate changes
function generateDiff(oldCode: string, newCode: string): DiffChange[] {
  const oldLines = oldCode.split("\n")
  const newLines = newCode.split("\n")
  const changes: DiffChange[] = []

  let oldIndex = 0
  let newIndex = 0
  let lineNumber = 1

  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    const oldLine = oldLines[oldIndex]
    const newLine = newLines[newIndex]

    if (oldIndex >= oldLines.length) {
      // Only new lines left
      changes.push({
        type: "add",
        lineNumber: lineNumber++,
        content: newLine,
        newLineNumber: newIndex + 1,
      })
      newIndex++
    } else if (newIndex >= newLines.length) {
      // Only old lines left
      changes.push({
        type: "remove",
        lineNumber: lineNumber++,
        content: oldLine,
        oldLineNumber: oldIndex + 1,
      })
      oldIndex++
    } else if (oldLine === newLine) {
      // Lines are the same
      changes.push({
        type: "unchanged",
        lineNumber: lineNumber++,
        content: oldLine,
        oldLineNumber: oldIndex + 1,
        newLineNumber: newIndex + 1,
      })
      oldIndex++
      newIndex++
    } else {
      // Lines are different - for simplicity, treat as remove + add
      changes.push({
        type: "remove",
        lineNumber: lineNumber++,
        content: oldLine,
        oldLineNumber: oldIndex + 1,
      })
      changes.push({
        type: "add",
        lineNumber: lineNumber++,
        content: newLine,
        newLineNumber: newIndex + 1,
      })
      oldIndex++
      newIndex++
    }
  }

  return changes
}

const CodeDiff = React.forwardRef<HTMLDivElement, CodeDiffProps>(
  (
    {
      className,
      theme,
      size,
      oldCode,
      newCode,
      language = "text",
      filename,
      oldFilename,
      newFilename,
      showLineNumbers = true,
      showCopyButton = true,
      maxHeight = "500px",
      defaultView = "unified",
      collapseUnchanged = false,
      contextLines = 3,
      ...props
    },
    ref
  ) => {
    const [view, setView] = React.useState<"unified" | "split">(defaultView)
    const [copied, setCopied] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(true)
    const [highlightedOldCode, setHighlightedOldCode] =
      React.useState<string>("")
    const [highlightedNewCode, setHighlightedNewCode] =
      React.useState<string>("")
    const [changes, setChanges] = React.useState<DiffChange[]>([])

    const themeMap = {
      dark: "github-dark",
      light: "github-light",
      github: "github-light",
      "github-dark": "github-dark",
    }

    React.useEffect(() => {
      const highlightCode = async () => {
        setIsLoading(true)
        try {
          const [oldHighlighted, newHighlighted] = await Promise.all([
            codeToHtml(oldCode, {
              lang: language,
              theme: themeMap[theme || "dark"],
            }),
            codeToHtml(newCode, {
              lang: language,
              theme: themeMap[theme || "dark"],
            }),
          ])

          // Extract just the inner HTML content
          const extractContent = (html: string) => {
            const tempDiv = document.createElement("div")
            tempDiv.innerHTML = html
            const codeElement = tempDiv.querySelector("code")
            return codeElement?.innerHTML || html
          }

          setHighlightedOldCode(extractContent(oldHighlighted))
          setHighlightedNewCode(extractContent(newHighlighted))

          // Generate diff changes
          const diffChanges = generateDiff(oldCode, newCode)
          setChanges(diffChanges)
        } catch (error) {
          console.error("Failed to highlight code:", error)
          setHighlightedOldCode(oldCode)
          setHighlightedNewCode(newCode)
          setChanges(generateDiff(oldCode, newCode))
        } finally {
          setIsLoading(false)
        }
      }

      highlightCode()
    }, [oldCode, newCode, language, theme])

    const copyToClipboard = React.useCallback(async () => {
      try {
        const diffText =
          view === "unified"
            ? changes
                .map((change) => {
                  const prefix =
                    change.type === "add"
                      ? "+"
                      : change.type === "remove"
                        ? "-"
                        : " "
                  return `${prefix}${change.content}`
                })
                .join("\n")
            : `--- ${oldFilename || "old"}\n+++ ${newFilename || "new"}\n${oldCode}\n\n${newCode}`

        await navigator.clipboard.writeText(diffText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error("Failed to copy diff:", error)
      }
    }, [changes, view, oldCode, newCode, oldFilename, newFilename])

    const filteredChanges = React.useMemo(() => {
      if (!collapseUnchanged) return changes

      const result: DiffChange[] = []
      let i = 0

      while (i < changes.length) {
        const change = changes[i]

        if (change.type !== "unchanged") {
          result.push(change)
          i++
          continue
        }

        // Find consecutive unchanged lines
        const unchangedStart = i
        while (i < changes.length && changes[i].type === "unchanged") {
          i++
        }

        const unchangedCount = i - unchangedStart

        if (unchangedCount <= contextLines * 2) {
          // Include all unchanged lines if there aren't many
          for (let j = unchangedStart; j < i; j++) {
            result.push(changes[j])
          }
        } else {
          // Include context lines at the beginning
          for (let j = unchangedStart; j < unchangedStart + contextLines; j++) {
            result.push(changes[j])
          }

          // Add collapse indicator
          result.push({
            type: "unchanged",
            lineNumber: -1,
            content: `... ${unchangedCount - contextLines * 2} unchanged lines ...`,
          })

          // Include context lines at the end
          for (let j = i - contextLines; j < i; j++) {
            result.push(changes[j])
          }
        }
      }

      return result
    }, [changes, collapseUnchanged, contextLines])

    const stats = React.useMemo(() => {
      const additions = changes.filter((c) => c.type === "add").length
      const deletions = changes.filter((c) => c.type === "remove").length
      return { additions, deletions }
    }, [changes])

    const renderUnifiedView = () => {
      const oldLines = highlightedOldCode.split("\n")
      const newLines = highlightedNewCode.split("\n")

      return (
        <div className="font-mono">
          {filteredChanges.map((change, index) => {
            if (change.lineNumber === -1) {
              // Collapse indicator
              return (
                <div
                  key={index}
                  className="flex items-center justify-center py-2 text-muted-foreground bg-muted/30"
                >
                  <span className="text-xs">{change.content}</span>
                </div>
              )
            }

            let highlightedContent = change.content
            if (change.type === "add" && change.newLineNumber) {
              highlightedContent =
                newLines[change.newLineNumber - 1] || change.content
            } else if (change.type === "remove" && change.oldLineNumber) {
              highlightedContent =
                oldLines[change.oldLineNumber - 1] || change.content
            } else if (change.type === "unchanged" && change.oldLineNumber) {
              highlightedContent =
                oldLines[change.oldLineNumber - 1] || change.content
            }

            return (
              <DiffLine
                key={index}
                change={change}
                showLineNumbers={showLineNumbers}
                isUnified={true}
                highlightedContent={highlightedContent}
              />
            )
          })}
        </div>
      )
    }

    const renderSplitView = () => {
      const oldLines = highlightedOldCode.split("\n")
      const newLines = highlightedNewCode.split("\n")

      return (
        <div className="grid grid-cols-2 gap-0">
          {/* Old Code */}
          <div className="border-r">
            <div className="border-b px-4 py-2 bg-red-500/10">
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                {oldFilename || filename || "Old"}
              </span>
            </div>
            <div className="font-mono">
              {oldLines.map((line, index) => (
                <DiffLine
                  key={`old-${index}`}
                  change={{
                    type: "remove",
                    lineNumber: index + 1,
                    content: line,
                    oldLineNumber: index + 1,
                  }}
                  showLineNumbers={showLineNumbers}
                  highlightedContent={line}
                />
              ))}
            </div>
          </div>

          {/* New Code */}
          <div>
            <div className="border-b px-4 py-2 bg-green-500/10">
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                {newFilename || filename || "New"}
              </span>
            </div>
            <div className="font-mono">
              {newLines.map((line, index) => (
                <DiffLine
                  key={`new-${index}`}
                  change={{
                    type: "add",
                    lineNumber: index + 1,
                    content: line,
                    newLineNumber: index + 1,
                  }}
                  showLineNumbers={showLineNumbers}
                  highlightedContent={line}
                />
              ))}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(codeDiffVariants({ theme, size, className }))}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <GitCompare className="h-4 w-4 text-muted-foreground" />
              {filename && (
                <span className="text-sm font-medium">{filename}</span>
              )}
              {language && (
                <Badge variant="secondary" className="text-xs">
                  {language}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Plus className="h-3 w-3 text-green-500" />
                {stats.additions}
              </span>
              <span className="flex items-center gap-1">
                <Minus className="h-3 w-3 text-red-500" />
                {stats.deletions}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={view}
              onValueChange={(value) =>
                value && setView(value as "unified" | "split")
              }
              size="sm"
            >
              <ToggleGroupItem value="unified" aria-label="Unified view">
                <Square className="h-3 w-3" />
              </ToggleGroupItem>
              <ToggleGroupItem value="split" aria-label="Split view">
                <SplitSquareHorizontal className="h-3 w-3" />
              </ToggleGroupItem>
            </ToggleGroup>

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
                  {copied ? "Copied" : "Copy diff"}
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
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
          ) : view === "unified" ? (
            renderUnifiedView()
          ) : (
            renderSplitView()
          )}
        </div>
      </div>
    )
  }
)

CodeDiff.displayName = "CodeDiff"

export { CodeDiff, codeDiffVariants }
