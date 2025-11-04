"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { Index } from "@/__registry__"
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Download, Eye, GripVertical, Plus, Trash2 } from "lucide-react"

import { Button } from "@/registry/new-york/ui/button"
import { Card } from "@/registry/new-york/ui/card"
import { Input } from "@/registry/new-york/ui/input"
import { ScrollArea } from "@/registry/new-york/ui/scroll-area"
import { Separator } from "@/registry/new-york/ui/separator"

// Dynamic block component loader
const DynamicBlock = ({ blockName, scale = 1 }: { blockName: string; scale?: number }) => {
  const [BlockComponent, setBlockComponent] = React.useState<React.ComponentType | null>(null)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    import(`@/registry/default/block/${blockName}`)
      .then((mod) => {
        setBlockComponent(() => mod.default)
        setError(false)
      })
      .catch((err) => {
        console.error(`Failed to load block ${blockName}:`, err)
        setError(true)
      })
  }, [blockName])

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/50 p-4 text-center">
        <p className="text-xs text-muted-foreground">Failed to load {blockName}</p>
      </div>
    )
  }

  if (!BlockComponent) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/50">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
      <BlockComponent />
    </div>
  )
}

interface PageBlock {
  id: string
  blockName: string
}

export default function PageBuilder() {
  const [blocks, setBlocks] = React.useState<string[]>([])
  const [availableBlocks, setAvailableBlocks] = React.useState<string[]>([])
  const [pageBlocks, setPageBlocks] = React.useState<PageBlock[]>([])
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState("")
  const [viewport, setViewport] = React.useState<"desktop" | "tablet" | "mobile">("desktop")

  React.useEffect(() => {
    // Get block IDs from the registry index
    const blockIds = Object.keys(Index.default || {}).filter((key) => {
      const item = Index.default[key]
      return item?.type === "components:block"
    })
    setBlocks(blockIds)
    setAvailableBlocks(blockIds)
  }, [])

  const filteredBlocks = availableBlocks.filter((block) =>
    block.toLowerCase().includes(filter.toLowerCase())
  )

  const addBlock = (blockName: string) => {
    setPageBlocks([...pageBlocks, { id: crypto.randomUUID(), blockName }])
  }

  const removeBlock = (id: string) => {
    setPageBlocks(pageBlocks.filter((b) => b.id !== id))
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    setPageBlocks((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)
      return arrayMove(items, oldIndex, newIndex)
    })
  }

  const generatePageCode = () => {
    const imports = pageBlocks
      .map((block) => `import ${toPascalCase(block.blockName)} from "@/registry/default/block/${block.blockName}"`)
      .join("\n")

    const components = pageBlocks
      .map((block) => `      <${toPascalCase(block.blockName)} />`)
      .join("\n")

    return `"use client"

import * as React from "react"
${imports}

export default function CustomPage() {
  return (
    <div className="flex min-h-screen flex-col">
${components}
    </div>
  )
}
`
  }

  const copyCode = async () => {
    const code = generatePageCode()
    await navigator.clipboard.writeText(code)
    // TODO: Show toast notification
  }

  const downloadCode = () => {
    const code = generatePageCode()
    const blob = new Blob([code], { type: "text/typescript" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "page.tsx"
    a.click()
    URL.revokeObjectURL(url)
  }

  const deployWithHanzo = () => {
    // TODO: Integrate with Hanzo deployment API
    const code = generatePageCode()
    console.log("Deploying with Hanzo:", code)
    // This would call hanzo deployment service
    window.open("https://hanzo.ai/deploy", "_blank")
  }

  const toPascalCase = (str: string) => {
    return str
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("")
  }

  const viewportWidths = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  }

  return (
    <div className="flex h-screen max-h-screen gap-4 p-6">
      {/* Left Sidebar - Block Library */}
      <div className="w-64 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Block Library</h2>
          <p className="text-sm text-muted-foreground">
            Drag blocks to build your page
          </p>
        </div>

        <Input
          placeholder="Filter blocks..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-4">
            {filteredBlocks.map((block) => (
              <Card
                key={block}
                className="cursor-grab overflow-hidden transition-colors hover:bg-muted"
                onClick={() => addBlock(block)}
              >
                {/* 1/4 Scale Block Preview */}
                <div className="relative h-32 overflow-hidden bg-muted/50">
                  <div className="pointer-events-none">
                    <DynamicBlock blockName={block} scale={0.25} />
                  </div>
                  {/* Overlay with block name and add button */}
                  <div className="absolute inset-0 flex items-center justify-center bg-background/0 opacity-0 transition-opacity hover:bg-background/80 hover:opacity-100">
                    <div className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      <span className="text-sm font-medium">Add to page</span>
                    </div>
                  </div>
                </div>
                <div className="border-t p-2">
                  <p className="truncate text-xs font-medium">{block}</p>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator orientation="vertical" />

      {/* Center - Page Builder Canvas */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Page Builder</h2>
            <p className="text-sm text-muted-foreground">
              {pageBlocks.length} blocks in page
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Viewport Controls */}
            <div className="flex rounded-lg border">
              <Button
                variant={viewport === "mobile" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewport("mobile")}
                className="rounded-r-none"
              >
                Mobile
              </Button>
              <Button
                variant={viewport === "tablet" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewport("tablet")}
                className="rounded-none border-x"
              >
                Tablet
              </Button>
              <Button
                variant={viewport === "desktop" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewport("desktop")}
                className="rounded-l-none"
              >
                Desktop
              </Button>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyCode}
              disabled={pageBlocks.length === 0}
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <rect width="13" height="13" x="9" y="9" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy Code
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadCode}
              disabled={pageBlocks.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={deployWithHanzo}
              disabled={pageBlocks.length === 0}
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Deploy with Hanzo
            </Button>
          </div>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-140px)] rounded-lg border bg-background">
          <div className="flex min-h-full items-start justify-center p-4">
            <div
              style={{
                width: viewportWidths[viewport],
                maxWidth: "100%",
                transition: "width 0.3s ease",
              }}
            >
              <DndContext
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={pageBlocks.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="min-h-[600px] bg-background">
                    {pageBlocks.length === 0 ? (
                      <div className="flex h-96 items-center justify-center rounded-lg border border-dashed text-center">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Your page is empty
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Click blocks from the left to add them
                          </p>
                        </div>
                      </div>
                    ) : (
                      pageBlocks.map((block) => (
                        <SortableBlock
                          key={block.id}
                          id={block.id}
                          blockName={block.blockName}
                          onRemove={() => removeBlock(block.id)}
                        />
                      ))
                    )}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeId ? (
                    <div className="rounded-lg border bg-card p-4 shadow-lg">
                      <p className="text-sm font-medium">
                        {pageBlocks.find((b) => b.id === activeId)?.blockName}
                      </p>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

function SortableBlock({
  id,
  blockName,
  onRemove,
}: {
  id: string
  blockName: string
  onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <div className="absolute -left-12 top-2 z-10 flex flex-col items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab rounded bg-card p-1 shadow-sm hover:shadow active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-6 w-6 bg-background/80 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Block Preview - No gaps between blocks */}
      <div className="relative overflow-hidden border-b last:border-b-0">
        <DynamicBlock blockName={blockName} scale={1} />
      </div>
    </div>
  )
}
