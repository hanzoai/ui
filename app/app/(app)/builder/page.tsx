"use client"

import * as React from "react"
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

  const exportPage = () => {
    const code = pageBlocks
      .map((block, i) => `<Block${i + 1} name="${block.blockName}" />`)
      .join("\n")

    const blob = new Blob([code], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "page-layout.tsx"
    a.click()
  }

  return (
    <div className="container flex h-screen max-h-screen gap-4 py-6">
      {/* Left Sidebar - Block Library */}
      <div className="w-80 space-y-4">
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
          <div className="space-y-2">
            {filteredBlocks.map((block) => (
              <Card
                key={block}
                className="cursor-grab p-3 transition-colors hover:bg-muted"
                onClick={() => addBlock(block)}
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{block}</span>
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportPage}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-140px)] rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={pageBlocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="min-h-[600px] space-y-4 p-4">
                {pageBlocks.length === 0 ? (
                  <div className="flex h-96 items-center justify-center text-center">
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
        </ScrollArea>
      </div>

      {/* Right Sidebar - Block Preview */}
      <div className="w-80 space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Block Info</h3>
          <p className="text-sm text-muted-foreground">
            Click a block to see details
          </p>
        </div>
        {/* Preview/info panel */}
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
      <div className="absolute -left-8 top-4 z-10 flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab rounded bg-card p-1 shadow active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <div className="relative overflow-hidden rounded-lg border">
        <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="bg-background/80 backdrop-blur"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Block Preview */}
        <div className="pointer-events-none">
          <iframe
            src={`/blocks/default/${blockName}`}
            className="h-96 w-full border-0"
            title={blockName}
          />
        </div>

        <div className="border-t bg-card px-4 py-2">
          <p className="text-sm font-medium">{blockName}</p>
        </div>
      </div>
    </div>
  )
}
