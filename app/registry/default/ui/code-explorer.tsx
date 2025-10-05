"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  ChevronDown,
  ChevronRight,
  File,
  FileCode,
  FileImage,
  FileText,
  Folder,
  FolderOpen,
  Search,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import { Input } from "@/registry/default/ui/input"
import { ScrollArea } from "@/registry/default/ui/scroll-area"

const codeExplorerVariants = cva(
  "relative flex flex-col overflow-hidden rounded-lg border bg-background",
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

export interface FileTreeNode {
  id: string
  name: string
  type: "file" | "folder"
  path: string
  size?: number
  modified?: Date
  children?: FileTreeNode[]
  content?: string
  language?: string
  isExpanded?: boolean
}

export interface CodeExplorerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof codeExplorerVariants> {
  files: FileTreeNode[]
  onFileSelect?: (file: FileTreeNode) => void
  onFolderToggle?: (folder: FileTreeNode) => void
  selectedFile?: string
  showSearch?: boolean
  showFileIcons?: boolean
  showFileSize?: boolean
  showModifiedDate?: boolean
  height?: string
  defaultExpanded?: string[]
  searchPlaceholder?: string
  emptyMessage?: string
}

// File type icons mapping
const getFileIcon = (fileName: string, isFolder: boolean = false) => {
  if (isFolder) return Folder

  const ext = fileName.split(".").pop()?.toLowerCase()

  switch (ext) {
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
    case "vue":
    case "svelte":
      return FileCode
    case "json":
    case "xml":
    case "yaml":
    case "yml":
    case "toml":
    case "ini":
      return FileText
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
    case "webp":
    case "ico":
      return FileImage
    default:
      return File
  }
}

// Format file size
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return ""

  const units = ["B", "KB", "MB", "GB"]
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

// Format modified date
const formatModifiedDate = (date?: Date): string => {
  if (!date) return ""

  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

const CodeExplorer = React.forwardRef<HTMLDivElement, CodeExplorerProps>(
  (
    {
      className,
      size,
      files,
      onFileSelect,
      onFolderToggle,
      selectedFile,
      showSearch = true,
      showFileIcons = true,
      showFileSize = false,
      showModifiedDate = false,
      height = "400px",
      defaultExpanded = [],
      searchPlaceholder = "Search files...",
      emptyMessage = "No files found",
      ...props
    },
    ref
  ) => {
    const [searchTerm, setSearchTerm] = React.useState("")
    const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(
      new Set(defaultExpanded)
    )

    // Build file tree with expansion state
    const buildFileTree = React.useCallback(
      (nodes: FileTreeNode[]): FileTreeNode[] => {
        return nodes.map((node) => ({
          ...node,
          isExpanded: expandedFolders.has(node.id),
          children: node.children ? buildFileTree(node.children) : undefined,
        }))
      },
      [expandedFolders]
    )

    // Filter files based on search term
    const filterFiles = React.useCallback(
      (nodes: FileTreeNode[], term: string): FileTreeNode[] => {
        if (!term) return nodes

        const filtered: FileTreeNode[] = []

        for (const node of nodes) {
          if (node.name.toLowerCase().includes(term.toLowerCase())) {
            filtered.push(node)
          } else if (node.type === "folder" && node.children) {
            const filteredChildren = filterFiles(node.children, term)
            if (filteredChildren.length > 0) {
              filtered.push({
                ...node,
                children: filteredChildren,
                isExpanded: true, // Auto-expand folders with matches
              })
            }
          }
        }

        return filtered
      },
      []
    )

    const processedFiles = React.useMemo(() => {
      const withExpansion = buildFileTree(files)
      return searchTerm ? filterFiles(withExpansion, searchTerm) : withExpansion
    }, [files, searchTerm, buildFileTree, filterFiles])

    const toggleFolder = React.useCallback(
      (folder: FileTreeNode) => {
        setExpandedFolders((prev) => {
          const newSet = new Set(prev)
          if (newSet.has(folder.id)) {
            newSet.delete(folder.id)
          } else {
            newSet.add(folder.id)
          }
          return newSet
        })

        onFolderToggle?.(folder)
      },
      [onFolderToggle]
    )

    const renderFileNode = React.useCallback(
      (node: FileTreeNode, depth: number = 0) => {
        const Icon = showFileIcons
          ? getFileIcon(node.name, node.type === "folder")
          : null
        const FolderIcon =
          node.type === "folder" && node.isExpanded ? FolderOpen : Folder
        const isSelected =
          selectedFile === node.id || selectedFile === node.path

        return (
          <div key={node.id}>
            <div
              className={cn(
                "flex items-center gap-2 px-2 py-1 hover:bg-muted/50 cursor-pointer transition-colors",
                isSelected && "bg-muted",
                "rounded-sm"
              )}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
              onClick={() => {
                if (node.type === "folder") {
                  toggleFolder(node)
                } else {
                  onFileSelect?.(node)
                }
              }}
            >
              {/* Folder chevron */}
              {node.type === "folder" && (
                <div className="w-4 h-4 flex items-center justify-center">
                  {node.isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </div>
              )}

              {/* File/Folder icon */}
              {showFileIcons && (
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  {node.type === "folder" ? (
                    <FolderIcon className="h-4 w-4 text-blue-500" />
                  ) : Icon ? (
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  ) : null}
                </div>
              )}

              {/* File/Folder name */}
              <span className="flex-1 truncate">{node.name}</span>

              {/* File size */}
              {showFileSize && node.type === "file" && node.size && (
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatFileSize(node.size)}
                </span>
              )}

              {/* Modified date */}
              {showModifiedDate && node.modified && (
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatModifiedDate(node.modified)}
                </span>
              )}
            </div>

            {/* Render children if folder is expanded */}
            {node.type === "folder" && node.isExpanded && node.children && (
              <div>
                {node.children.map((child) => renderFileNode(child, depth + 1))}
              </div>
            )}
          </div>
        )
      },
      [
        showFileIcons,
        showFileSize,
        showModifiedDate,
        selectedFile,
        toggleFolder,
        onFileSelect,
      ]
    )

    const clearSearch = () => {
      setSearchTerm("")
    }

    return (
      <div
        ref={ref}
        className={cn(codeExplorerVariants({ size }), className)}
        style={{ height }}
        {...props}
      >
        {/* Header with search */}
        {showSearch && (
          <div className="flex items-center gap-2 border-b px-4 py-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-8 pr-8 h-8"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* File tree */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {processedFiles.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-muted-foreground">
                {searchTerm ? `No files match "${searchTerm}"` : emptyMessage}
              </div>
            ) : (
              <div className="space-y-0.5">
                {processedFiles.map((node) => renderFileNode(node, 0))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer with file count */}
        <div className="border-t px-4 py-2 text-xs text-muted-foreground">
          {(() => {
            const countFiles = (
              nodes: FileTreeNode[]
            ): { files: number; folders: number } => {
              let files = 0
              let folders = 0

              for (const node of nodes) {
                if (node.type === "file") {
                  files++
                } else {
                  folders++
                  if (node.children) {
                    const childCounts = countFiles(node.children)
                    files += childCounts.files
                    folders += childCounts.folders
                  }
                }
              }

              return { files, folders }
            }

            const { files: fileCount, folders: folderCount } =
              countFiles(processedFiles)
            const parts = []

            if (fileCount > 0)
              parts.push(`${fileCount} file${fileCount === 1 ? "" : "s"}`)
            if (folderCount > 0)
              parts.push(`${folderCount} folder${folderCount === 1 ? "" : "s"}`)

            return parts.join(", ") || "Empty"
          })()}
          {searchTerm && <span> (filtered)</span>}
        </div>
      </div>
    )
  }
)

CodeExplorer.displayName = "CodeExplorer"

export { CodeExplorer, codeExplorerVariants }
