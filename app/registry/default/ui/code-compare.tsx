"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  GitMerge,
  MoreHorizontal,
  RotateCcw,
  Settings,
  SplitSquareHorizontal,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import { CodeDiff } from "@/registry/default/ui/code-diff"
import { CodeSnippet } from "@/registry/default/ui/code-snippet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/registry/default/ui/dropdown-menu"
import { ScrollArea } from "@/registry/default/ui/scroll-area"
import { Separator } from "@/registry/default/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/registry/default/ui/tabs"

const codeCompareVariants = cva(
  "relative flex flex-col overflow-hidden rounded-lg border bg-background",
  {
    variants: {
      layout: {
        horizontal: "flex-col",
        vertical: "flex-row",
      },
      size: {
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base",
      },
    },
    defaultVariants: {
      layout: "horizontal",
      size: "default",
    },
  }
)

export interface CompareFile {
  id: string
  filename: string
  content: string
  language: string
  label?: string
  version?: string
  lastModified?: Date
}

export interface ConflictMarker {
  startLine: number
  endLine: number
  type: "conflict" | "incoming" | "current"
  content: string
}

export interface CodeCompareProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof codeCompareVariants> {
  files: CompareFile[]
  defaultView?: "side-by-side" | "unified" | "three-way"
  showLineNumbers?: boolean
  showCopyButton?: boolean
  allowMerge?: boolean
  conflictMarkers?: ConflictMarker[]
  onMergeConflict?: (resolution: string) => void
  onFileSelect?: (fileId: string) => void
  height?: string
  syncScroll?: boolean
}

interface MergeState {
  resolved: Record<string, string>
  conflicts: ConflictMarker[]
}

const CodeCompare = React.forwardRef<HTMLDivElement, CodeCompareProps>(
  (
    {
      className,
      layout,
      size,
      files,
      defaultView = "side-by-side",
      showLineNumbers = true,
      showCopyButton = true,
      allowMerge = false,
      conflictMarkers = [],
      onMergeConflict,
      onFileSelect,
      height = "600px",
      syncScroll = true,
      ...props
    },
    ref
  ) => {
    const [view, setView] = React.useState(defaultView)
    const [selectedFiles, setSelectedFiles] = React.useState<string[]>(() => {
      if (files.length >= 2) {
        return [files[0].id, files[1].id]
      }
      return files.length > 0 ? [files[0].id] : []
    })
    const [mergeState, setMergeState] = React.useState<MergeState>({
      resolved: {},
      conflicts: conflictMarkers,
    })
    const [copied, setCopied] = React.useState(false)

    const scrollRefs = React.useRef<Record<string, HTMLDivElement | null>>({})

    // Sync scroll between panes
    const handleScroll = React.useCallback(
      (sourceId: string, scrollTop: number) => {
        if (!syncScroll) return

        Object.entries(scrollRefs.current).forEach(([id, ref]) => {
          if (id !== sourceId && ref) {
            ref.scrollTop = scrollTop
          }
        })
      },
      [syncScroll]
    )

    const copyComparison = React.useCallback(async () => {
      const comparison = selectedFiles
        .map((fileId) => {
          const file = files.find((f) => f.id === fileId)
          return file ? `=== ${file.filename} ===\n${file.content}` : ""
        })
        .join("\n\n")

      try {
        await navigator.clipboard.writeText(comparison)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error("Failed to copy comparison:", error)
      }
    }, [files, selectedFiles])

    const resolveConflict = React.useCallback(
      (conflictIndex: number, resolution: string) => {
        setMergeState((prev) => ({
          ...prev,
          resolved: {
            ...prev.resolved,
            [conflictIndex]: resolution,
          },
        }))

        onMergeConflict?.(resolution)
      },
      [onMergeConflict]
    )

    const getFileStats = React.useCallback(
      (file1: CompareFile, file2: CompareFile) => {
        const lines1 = file1.content.split("\n")
        const lines2 = file2.content.split("\n")

        // Simple line-by-line comparison
        let added = 0
        let removed = 0
        let modified = 0

        const maxLines = Math.max(lines1.length, lines2.length)

        for (let i = 0; i < maxLines; i++) {
          const line1 = lines1[i]
          const line2 = lines2[i]

          if (line1 === undefined) {
            added++
          } else if (line2 === undefined) {
            removed++
          } else if (line1 !== line2) {
            modified++
          }
        }

        return { added, removed, modified }
      },
      []
    )

    const renderFileSelector = () => (
      <div className="flex items-center gap-2 flex-wrap">
        {files.map((file, index) => (
          <div key={file.id} className="flex items-center gap-2">
            <Button
              variant={selectedFiles.includes(file.id) ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (view === "three-way") {
                  // For three-way, allow up to 3 files
                  setSelectedFiles((prev) => {
                    if (prev.includes(file.id)) {
                      return prev.filter((id) => id !== file.id)
                    }
                    return prev.length < 3
                      ? [...prev, file.id]
                      : [prev[1], prev[2], file.id]
                  })
                } else {
                  // For side-by-side/unified, allow up to 2 files
                  setSelectedFiles((prev) => {
                    if (prev.includes(file.id)) {
                      return prev.filter((id) => id !== file.id)
                    }
                    return prev.length < 2
                      ? [...prev, file.id]
                      : [prev[1], file.id]
                  })
                }
                onFileSelect?.(file.id)
              }}
              className="gap-2"
            >
              {file.label || file.filename}
              {file.version && (
                <Badge variant="secondary" className="text-xs">
                  {file.version}
                </Badge>
              )}
            </Button>
            {index < files.length - 1 && view !== "three-way" && (
              <span className="text-muted-foreground">vs</span>
            )}
          </div>
        ))}
      </div>
    )

    const renderSideBySide = () => {
      const [file1, file2] = selectedFiles
        .map((id) => files.find((f) => f.id === id))
        .filter(Boolean) as CompareFile[]

      if (!file1 || !file2) {
        return (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Select two files to compare
          </div>
        )
      }

      const stats = getFileStats(file1, file2)

      return (
        <div className="flex flex-col h-full">
          {/* Stats */}
          <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/30">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Comparison</span>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-green-600">+{stats.added}</span>
                <span className="text-red-600">-{stats.removed}</span>
                <span className="text-yellow-600">~{stats.modified}</span>
              </div>
            </div>
          </div>

          {/* Comparison */}
          <div className="flex-1 min-h-0">
            <CodeDiff
              oldCode={file1.content}
              newCode={file2.content}
              language={file1.language}
              oldFilename={file1.filename}
              newFilename={file2.filename}
              showLineNumbers={showLineNumbers}
              showCopyButton={false}
              maxHeight="100%"
              defaultView="split"
              className="border-0 rounded-none h-full"
            />
          </div>
        </div>
      )
    }

    const renderUnified = () => {
      const [file1, file2] = selectedFiles
        .map((id) => files.find((f) => f.id === id))
        .filter(Boolean) as CompareFile[]

      if (!file1 || !file2) {
        return (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Select two files to compare
          </div>
        )
      }

      return (
        <CodeDiff
          oldCode={file1.content}
          newCode={file2.content}
          language={file1.language}
          filename={`${file1.filename} → ${file2.filename}`}
          showLineNumbers={showLineNumbers}
          showCopyButton={false}
          maxHeight="100%"
          defaultView="unified"
          className="border-0 rounded-none"
        />
      )
    }

    const renderThreeWay = () => {
      const [base, current, incoming] = selectedFiles
        .map((id) => files.find((f) => f.id === id))
        .filter(Boolean) as CompareFile[]

      if (!base || !current || !incoming) {
        return (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Select three files for three-way merge (base, current, incoming)
          </div>
        )
      }

      return (
        <div className="grid grid-cols-3 gap-0 h-full">
          {/* Base */}
          <div className="border-r">
            <div className="border-b px-4 py-2 bg-muted/30">
              <span className="text-sm font-medium">
                Base ({base.filename})
              </span>
            </div>
            <ScrollArea
              className="h-full"
              ref={(ref) => (scrollRefs.current["base"] = ref)}
              onScrollCapture={(e) => {
                const target = e.target as HTMLDivElement
                handleScroll("base", target.scrollTop)
              }}
            >
              <CodeSnippet
                code={base.content}
                language={base.language}
                showLineNumbers={showLineNumbers}
                showCopyButton={false}
                showHeader={false}
                className="border-0 rounded-none"
              />
            </ScrollArea>
          </div>

          {/* Current */}
          <div className="border-r">
            <div className="border-b px-4 py-2 bg-blue-500/10">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Current ({current.filename})
              </span>
            </div>
            <ScrollArea
              className="h-full"
              ref={(ref) => (scrollRefs.current["current"] = ref)}
              onScrollCapture={(e) => {
                const target = e.target as HTMLDivElement
                handleScroll("current", target.scrollTop)
              }}
            >
              <CodeSnippet
                code={current.content}
                language={current.language}
                showLineNumbers={showLineNumbers}
                showCopyButton={false}
                showHeader={false}
                className="border-0 rounded-none"
              />
            </ScrollArea>
          </div>

          {/* Incoming */}
          <div>
            <div className="border-b px-4 py-2 bg-green-500/10">
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Incoming ({incoming.filename})
              </span>
            </div>
            <ScrollArea
              className="h-full"
              ref={(ref) => (scrollRefs.current["incoming"] = ref)}
              onScrollCapture={(e) => {
                const target = e.target as HTMLDivElement
                handleScroll("incoming", target.scrollTop)
              }}
            >
              <CodeSnippet
                code={incoming.content}
                language={incoming.language}
                showLineNumbers={showLineNumbers}
                showCopyButton={false}
                showHeader={false}
                className="border-0 rounded-none"
              />
            </ScrollArea>
          </div>
        </div>
      )
    }

    const renderMergeConflicts = () => {
      if (!allowMerge || mergeState.conflicts.length === 0) return null

      return (
        <div className="border-t bg-muted/30">
          <div className="px-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Merge Conflicts</span>
              <Badge variant="destructive" className="text-xs">
                {mergeState.conflicts.length}
              </Badge>
            </div>
            <div className="mt-2 space-y-2">
              {mergeState.conflicts.map((conflict, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <span>
                    Lines {conflict.startLine}-{conflict.endLine}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resolveConflict(index, "current")}
                      className="h-6 text-xs"
                    >
                      Keep Current
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resolveConflict(index, "incoming")}
                      className="h-6 text-xs"
                    >
                      Accept Incoming
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(codeCompareVariants({ layout, size }), className)}
        style={{ height }}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-4">{renderFileSelector()}</div>

          <div className="flex items-center gap-2">
            <Tabs value={view} onValueChange={(value) => setView(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="side-by-side" className="text-xs">
                  Side by Side
                </TabsTrigger>
                <TabsTrigger value="unified" className="text-xs">
                  Unified
                </TabsTrigger>
                <TabsTrigger value="three-way" className="text-xs">
                  Three-way
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {showCopyButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={copyComparison}
                className="h-8 w-8 p-0"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setSelectedFiles([])}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Selection
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          {view === "side-by-side" && renderSideBySide()}
          {view === "unified" && renderUnified()}
          {view === "three-way" && renderThreeWay()}
        </div>

        {/* Merge conflicts */}
        {renderMergeConflicts()}
      </div>
    )
  }
)

CodeCompare.displayName = "CodeCompare"

export { CodeCompare, codeCompareVariants }
